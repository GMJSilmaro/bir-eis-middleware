"use server";

import { revalidatePath } from "next/cache";

import {
  appendPayloadVersion,
  buildInvoiceContextFromDoc,
  runAndPersistTenantValidation,
} from "@/features/compliance/lib/compliance-queries";
import { isProductionTransmitAllowed } from "@/features/compliance/readiness/assess-readiness";
import { ensureComplianceActivation } from "@/features/compliance/lib/compliance-queries";
import {
  buildIdempotencyKey,
  canRetryTechnical,
  defaultTransmissionAdapter,
  nextBackoffMs,
} from "@/features/eis/transmission";
import { queueOutboundDocumentSchema } from "@/features/documents/schemas/document.schema";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";
import type { Prisma } from "@/lib/database/generated/prisma/client";
import { logPerfTotal, measureStage } from "@/lib/perf/measure";

import type { DocumentActionState } from "./create-outbound-document.action";

export async function queueOutboundDocumentAction(
  _prev: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const perfStart = performance.now();

  const session = await measureStage("auth", () =>
    requirePermission("documents.manage"),
  );
  const tenantId = session.user.tenantId;

  const parsed = queueOutboundDocumentSchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    logPerfTotal("queueOutboundDocument", perfStart);
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await measureStage("fetch", () =>
    prisma.invoiceDocument.findFirst({
      where: {
        id: parsed.data.id,
        tenantId,
        direction: "outbound",
        deletedAt: null,
      },
    }),
  );

  if (!existing) {
    logPerfTotal("queueOutboundDocument", perfStart);
    return { error: "Document not found." };
  }

  if (existing.status !== "draft" && existing.status !== "queued") {
    if (existing.status === "accepted" || existing.status === "submitted") {
      logPerfTotal("queueOutboundDocument", perfStart);
      return { error: "Accepted or submitted invoices cannot be edited or re-queued." };
    }
  }

  if (existing.status !== "draft") {
    logPerfTotal("queueOutboundDocument", perfStart);
    return { error: "Only draft documents can be queued." };
  }

  const taxpayer = await prisma.taxpayerProfile.findUnique({
    where: { tenantId },
  });
  const credential = await prisma.eisCredential.findUnique({
    where: { tenantId },
  });
  const environment = (credential?.environment === "prod" ? "prod" : "cert") as
    | "cert"
    | "prod";

  const activation = await ensureComplianceActivation(tenantId);
  if (
    !isProductionTransmitAllowed({
      productionEnabled: activation.productionEnabled,
      environment,
    })
  ) {
    logPerfTotal("queueOutboundDocument", perfStart);
    return {
      error:
        "Production transmission is blocked until EIS Integration Readiness gates pass (or an audited override is recorded).",
    };
  }

  const invoiceCtx = buildInvoiceContextFromDoc({
    documentNumber: existing.documentNumber,
    issueDate: existing.issueDate,
    documentType: existing.documentType,
    currency: existing.currency,
    sourceErpId: existing.sourceErpId,
    counterpartName: existing.counterpartName,
    counterpartTin: existing.counterpartTin,
    lineExtensionAmount: existing.lineExtensionAmount.toString(),
    taxAmount: existing.taxAmount.toString(),
    totalAmount: existing.totalAmount.toString(),
    sellerTin: taxpayer?.tin ?? credential?.tin,
    sellerRegisteredName: taxpayer?.registeredName,
    sellerBranchCode: taxpayer?.branchCode ?? existing.sellerBranchCode,
    vatMode: taxpayer?.vatMode,
    isDuplicateNumber: false,
  });

  const { summary } = await runAndPersistTenantValidation({
    tenantId,
    scope: "pre_transmit",
    invoice: invoiceCtx,
    entityType: "invoice_document",
    entityId: existing.id,
    createdById: session.user.id,
  });

  if (summary.hasBlockingFailure) {
    await prisma.invoiceDocument.update({
      where: { id: existing.id },
      data: { validationStatus: "quarantined", failureClass: "BUSINESS" },
    });
    await appendPayloadVersion({
      tenantId,
      invoiceDocumentId: existing.id,
      kind: "VALIDATION_RESULT",
      payload: { results: summary.results },
    });
    await writeAuditLog({
      tenantId,
      userId: session.user.id,
      action: "VALIDATION_FAILED",
      entityType: "invoice_document",
      entityId: existing.id,
      metadata: { blocking: summary.blockingFailureCount },
    });
    logPerfTotal("queueOutboundDocument", perfStart);
    const first = summary.results.find((r) => r.outcome === "FAIL" && r.blocking);
    return {
      error: `Quarantined: ${first?.message ?? "pre-transmission validation failed"}`,
    };
  }

  try {
    const updated = await measureStage("db update", () =>
      prisma.invoiceDocument.update({
        where: { id: existing.id },
        data: {
          status: "queued",
          eisAckStatus: "pending",
          validationStatus: "ok",
          failureClass: null,
        },
        select: { id: true, documentNumber: true, status: true },
      }),
    );

    await measureStage("audit", () =>
      writeAuditLog({
        tenantId,
        userId: session.user.id,
        action: "document.queued",
        entityType: "invoice_document",
        entityId: updated.id,
        metadata: {
          direction: "outbound",
          documentNumber: updated.documentNumber,
          status: updated.status,
        },
      }),
    );

    await measureStage("revalidate", async () => {
      revalidatePath("/outbound");
      revalidatePath(`/outbound/${updated.id}`);
    });

    logPerfTotal("queueOutboundDocument", perfStart);
    return {
      success: true,
      message:
        "Document queued for EIS transmission. Use Transmit (sandbox) to send a test submission.",
    };
  } catch {
    logPerfTotal("queueOutboundDocument", perfStart);
    return { error: "Could not queue the document. Please try again." };
  }
}

export async function transmitOutboundDocumentAction(
  _prev: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const session = await requirePermission("compliance.submit");
  const tenantId = session.user.tenantId;

  const parsed = queueOutboundDocumentSchema.safeParse({
    id: formData.get("id"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const doc = await prisma.invoiceDocument.findFirst({
    where: {
      id: parsed.data.id,
      tenantId,
      direction: "outbound",
      deletedAt: null,
    },
  });
  if (!doc) return { error: "Document not found." };
  if (doc.status !== "queued" && doc.status !== "rejected") {
    if (doc.failureClass === "TECHNICAL" || doc.status === "submitted") {
      // allow retry path below for technical
    } else if (doc.status !== "queued") {
      return { error: "Only queued documents can be transmitted." };
    }
  }

  const taxpayer = await prisma.taxpayerProfile.findUnique({
    where: { tenantId },
  });
  const credential = await prisma.eisCredential.findUnique({
    where: { tenantId },
  });
  const environment = (credential?.environment === "prod" ? "prod" : "cert") as
    | "cert"
    | "prod";
  const activation = await ensureComplianceActivation(tenantId);

  if (
    !isProductionTransmitAllowed({
      productionEnabled: activation.productionEnabled,
      environment,
    })
  ) {
    return {
      error:
        "Production transmission blocked — complete EIS Integration Readiness or use certification (sandbox) environment.",
    };
  }

  const tin = taxpayer?.tin ?? credential?.tin ?? "";
  const branchCode = taxpayer?.branchCode ?? doc.sellerBranchCode ?? "00000";
  const idempotencyKey = buildIdempotencyKey({
    tenantId,
    tin,
    branchCode,
    documentType: doc.documentType,
    documentNumber: doc.documentNumber,
    sourceErpId: doc.sourceErpId,
  });

  const priorAttempts = await prisma.transmissionAttempt.count({
    where: { tenantId, invoiceDocumentId: doc.id },
  });
  const attemptNo = priorAttempts + 1;

  // Idempotent: if prior attempt already accepted for same key, do not duplicate
  const priorAccepted = await prisma.transmissionAttempt.findFirst({
    where: {
      tenantId,
      idempotencyKey,
      status: "accepted",
    },
  });
  if (priorAccepted) {
    return {
      success: true,
      message: "Transmission already accepted for this idempotency key — no duplicate created.",
      documentId: doc.id,
    };
  }

  await writeAuditLog({
    tenantId,
    userId: session.user.id,
    action: "SUBMISSION_STARTED",
    entityType: "invoice_document",
    entityId: doc.id,
    metadata: { attemptNo, idempotencyKey },
  });

  await prisma.invoiceDocument.update({
    where: { id: doc.id },
    data: { status: "submitted", submittedAt: doc.submittedAt ?? new Date() },
  });

  const result = await defaultTransmissionAdapter.transmit({
    tenantId,
    documentId: doc.id,
    documentNumber: doc.documentNumber,
    documentType: doc.documentType,
    tin,
    branchCode,
    idempotencyKey,
    eisPayload: doc.eisJsonPayload,
    environment,
  });

  await prisma.transmissionAttempt.create({
    data: {
      tenantId,
      invoiceDocumentId: doc.id,
      attemptNo,
      idempotencyKey,
      failureClass: result.failureClass ?? null,
      httpStatus: result.httpStatus ?? null,
      status: result.status === "accepted" ? "accepted" : result.status === "rejected" ? "rejected" : result.status === "technical_failure" ? "retry_pending" : result.status,
      requestMeta: { environment, attemptNo } as Prisma.InputJsonValue,
      responseMeta: (result.responseMeta ?? {
        message: result.message,
      }) as Prisma.InputJsonValue,
      nextRetryAt:
        result.failureClass === "TECHNICAL" && canRetryTechnical(attemptNo)
          ? new Date(Date.now() + nextBackoffMs(attemptNo))
          : null,
    },
  });

  await appendPayloadVersion({
    tenantId,
    invoiceDocumentId: doc.id,
    kind: "BIR_RESPONSE",
    payload: {
      status: result.status,
      message: result.message,
      referenceId: result.referenceId,
      failureClass: result.failureClass,
      httpStatus: result.httpStatus,
    },
  });

  if (result.ok && result.status === "accepted") {
    await prisma.invoiceDocument.update({
      where: { id: doc.id },
      data: {
        status: "accepted",
        eisAckStatus: "accepted",
        eisAckMessage: result.message,
        eisAckAt: new Date(),
        eisReferenceId: result.referenceId ?? null,
        failureClass: null,
        validationStatus: "ok",
      },
    });
    await writeAuditLog({
      tenantId,
      userId: session.user.id,
      action: "SUBMISSION_SUCCEEDED",
      entityType: "invoice_document",
      entityId: doc.id,
      newState: { status: "accepted", referenceId: result.referenceId },
    });
    revalidatePath("/outbound");
    revalidatePath("/inbound");
    revalidatePath(`/outbound/${doc.id}`);
    return {
      success: true,
      message: result.message,
      documentId: doc.id,
    };
  }

  if (result.failureClass === "BUSINESS") {
    await prisma.invoiceDocument.update({
      where: { id: doc.id },
      data: {
        status: "rejected",
        eisAckStatus: "rejected",
        eisAckMessage: result.message,
        eisAckAt: new Date(),
        eisReferenceId: result.referenceId ?? null,
        failureClass: "BUSINESS",
      },
    });
    await writeAuditLog({
      tenantId,
      userId: session.user.id,
      action: "SUBMISSION_FAILED",
      entityType: "invoice_document",
      entityId: doc.id,
      metadata: { failureClass: "BUSINESS", autoRetry: false },
    });
    revalidatePath("/outbound");
    revalidatePath(`/outbound/${doc.id}`);
    return {
      error: `Business rejection — not auto-retried. ${result.message}`,
    };
  }

  // Technical failure — retry pending, do not create duplicate on next retry
  await prisma.invoiceDocument.update({
    where: { id: doc.id },
    data: {
      status: "queued",
      eisAckStatus: "pending",
      failureClass: "TECHNICAL",
      eisAckMessage: result.message,
    },
  });
  await writeAuditLog({
    tenantId,
    userId: session.user.id,
    action: "SUBMISSION_FAILED",
    entityType: "invoice_document",
    entityId: doc.id,
    metadata: {
      failureClass: "TECHNICAL",
      autoRetry: canRetryTechnical(attemptNo),
      attemptNo,
    },
  });
  await writeAuditLog({
    tenantId,
    userId: session.user.id,
    action: "RETRY_REQUESTED",
    entityType: "invoice_document",
    entityId: doc.id,
    reason: "Technical transmission failure — eligible for retry",
  });

  revalidatePath("/outbound");
  revalidatePath(`/outbound/${doc.id}`);
  return {
    error: `Technical failure — queued for retry. ${result.message}`,
  };
}
