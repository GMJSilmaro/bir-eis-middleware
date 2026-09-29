"use server";

import { revalidatePath } from "next/cache";

import {
  appendPayloadVersion,
  buildInvoiceContextFromDoc,
  runAndPersistTenantValidation,
} from "@/features/compliance/lib/compliance-queries";
import {
  readDocumentFormFields,
  toNullableNotes,
  toNullableTin,
} from "@/features/documents/lib/document-form-data";
import { documentNumberExists } from "@/features/documents/lib/document-queries";
import {
  buildEisJsonPersistFields,
  loadEisSellerForTenant,
  newInvoiceDocumentId,
} from "@/features/documents/lib/eis-json-persist";
import { createOutboundDocumentSchema } from "@/features/documents/schemas/document.schema";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export type DocumentActionState = {
  error?: string;
  success?: boolean;
  message?: string;
  documentId?: string;
};

export async function createOutboundDocumentAction(
  _prev: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const session = await requirePermission("documents.manage");
  const tenantId = session.user.tenantId;

  const parsed = createOutboundDocumentSchema.safeParse(
    readDocumentFormFields(formData),
  );

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const duplicate = await documentNumberExists({
    tenantId,
    direction: "outbound",
    documentNumber: data.documentNumber,
  });
  if (duplicate) {
    return {
      error: "An outbound document with this number already exists.",
    };
  }

  const seller = await loadEisSellerForTenant(tenantId);
  const taxpayer = await prisma.taxpayerProfile.findUnique({
    where: { tenantId },
  });

  const invoiceCtx = buildInvoiceContextFromDoc({
    documentNumber: data.documentNumber,
    issueDate: data.issueDate,
    documentType: data.documentType,
    currency: data.currency.toUpperCase(),
    counterpartName: data.counterpartName,
    counterpartTin: data.counterpartTin,
    lineExtensionAmount: data.lineExtensionAmount,
    taxAmount: data.taxAmount,
    totalAmount: data.totalAmount,
    sellerTin: taxpayer?.tin ?? seller.tin,
    sellerRegisteredName: taxpayer?.registeredName ?? seller.registeredName,
    sellerBranchCode: taxpayer?.branchCode ?? "00000",
    vatMode: taxpayer?.vatMode,
    isDuplicateNumber: false,
  });

  const { summary } = await runAndPersistTenantValidation({
    tenantId,
    scope: "invoice",
    invoice: invoiceCtx,
    createdById: session.user.id,
  });

  if (summary.hasBlockingFailure) {
    await writeAuditLog({
      tenantId,
      userId: session.user.id,
      action: "VALIDATION_FAILED",
      entityType: "invoice_document",
      metadata: {
        documentNumber: data.documentNumber,
        blocking: summary.blockingFailureCount,
      },
    });
    const first = summary.results.find((r) => r.outcome === "FAIL" && r.blocking);
    return {
      error: first?.message ?? "Compliance validation failed. Correct the source data and try again.",
    };
  }

  let createdId: string;
  try {
    const id = newInvoiceDocumentId();
    const issueDate = new Date(data.issueDate);
    const counterpartTin = toNullableTin(data.counterpartTin);
    const notes = toNullableNotes(data.notes);
    const eisJson = buildEisJsonPersistFields(
      {
        id,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        issueDate,
        currency: data.currency.toUpperCase(),
        counterpartName: data.counterpartName,
        counterpartTin,
        lineExtensionAmount: data.lineExtensionAmount,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        notes,
      },
      {
        tin: taxpayer?.tin ?? seller.tin,
        registeredName: taxpayer?.registeredName ?? seller.registeredName,
        branchCode: taxpayer?.branchCode ?? seller.branchCode,
        address: taxpayer?.businessAddress ?? seller.address,
        vatClassification: seller.vatClassification,
      },
    );

    const created = await prisma.invoiceDocument.create({
      data: {
        id,
        tenantId,
        createdById: session.user.id,
        direction: "outbound",
        status: "draft",
        source: "manual",
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        issueDate,
        currency: data.currency.toUpperCase(),
        counterpartName: data.counterpartName,
        counterpartTin,
        lineExtensionAmount: data.lineExtensionAmount,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        notes,
        validationStatus: "ok",
        sellerBranchCode: taxpayer?.branchCode ?? null,
        ...eisJson,
      },
      select: { id: true, documentNumber: true, eisJsonPayload: true },
    });

    await appendPayloadVersion({
      tenantId,
      invoiceDocumentId: created.id,
      kind: "CANONICAL",
      payload: {
        documentNumber: data.documentNumber,
        documentType: data.documentType,
        issueDate: data.issueDate,
        amounts: {
          line: data.lineExtensionAmount,
          tax: data.taxAmount,
          total: data.totalAmount,
        },
      },
    });

    if (created.eisJsonPayload) {
      await appendPayloadVersion({
        tenantId,
        invoiceDocumentId: created.id,
        kind: "EIS_DRAFT",
        payload: created.eisJsonPayload,
      });
    }

    await writeAuditLog({
      tenantId,
      userId: session.user.id,
      action: "document.created",
      entityType: "invoice_document",
      entityId: created.id,
      metadata: {
        direction: "outbound",
        documentNumber: created.documentNumber,
        status: "draft",
        source: "manual",
      },
    });

    createdId = created.id;
  } catch {
    return { error: "Could not create the document. Please try again." };
  }

  revalidatePath("/outbound");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Draft created successfully.",
    documentId: createdId,
  };
}
