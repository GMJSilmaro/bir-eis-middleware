"use server";

import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

import type { DocumentActionState } from "./create-outbound-document.action";

function sandboxDecide(
  documentNumber: string,
  environment: string,
): "accepted" | "rejected" {
  const key = `${environment}:${documentNumber}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  // Deterministic demo mix; cert leans toward accept.
  const rejectBucket = environment === "prod" ? 28 : 18;
  return hash % 100 < rejectBucket ? "rejected" : "accepted";
}

function sandboxMessage(
  status: "accepted" | "rejected",
  environment: string,
): string {
  const envLabel = environment === "prod" ? "production" : "certification";
  if (status === "accepted") {
    return `Sandbox EIS (${envLabel}): document accepted.`;
  }
  return `Sandbox EIS (${envLabel}): document rejected (demo validation).`;
}

/**
 * Sandbox refresh of pending EIS responses — no live BIR HTTP.
 * Applies deterministic accept/reject using the tenant credential environment label.
 */
export async function syncEisResponsesAction(
  _prev: DocumentActionState,
  _formData: FormData,
): Promise<DocumentActionState> {
  void _formData;
  const session = await requirePermission("documents.manage");
  const tenantId = session.user.tenantId;

  const credential = await prisma.eisCredential.findFirst({
    where: { tenantId, deletedAt: null },
    select: { environment: true },
  });
  const environment = credential?.environment === "prod" ? "prod" : "cert";

  const pending = await prisma.invoiceDocument.findMany({
    where: {
      tenantId,
      direction: "outbound",
      deletedAt: null,
      status: { in: ["queued", "submitted"] },
      OR: [{ eisAckStatus: null }, { eisAckStatus: "pending" }],
    },
    select: {
      id: true,
      documentNumber: true,
      eisReferenceId: true,
      submittedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (pending.length === 0) {
    return {
      success: true,
      message: "No pending EIS responses to refresh.",
    };
  }

  const now = new Date();
  let synced = 0;

  try {
    for (const doc of pending) {
      const eisAckStatus = sandboxDecide(doc.documentNumber, environment);
      const eisReferenceId =
        doc.eisReferenceId?.trim() ||
        `EIS-SANDBOX-${environment.toUpperCase()}-${doc.documentNumber}`;

      await prisma.invoiceDocument.update({
        where: { id: doc.id },
        data: {
          status: eisAckStatus,
          eisAckStatus,
          eisAckMessage: sandboxMessage(eisAckStatus, environment),
          eisAckAt: now,
          eisReferenceId,
          submittedAt: doc.submittedAt ?? now,
        },
      });
      synced += 1;
    }

    await writeAuditLog({
      tenantId,
      userId: session.user.id,
      action: "document.eis_synced",
      entityType: "invoice_document",
      entityId: null,
      metadata: {
        environment,
        syncedCount: synced,
        documentNumbers: pending.map((d) => d.documentNumber),
      },
    });

    revalidatePath("/inbound");
    revalidatePath("/outbound");
    revalidatePath("/dashboard");
    revalidatePath("/audit-log");

    return {
      success: true,
      message:
        synced === 1
          ? "Synced 1 EIS response from sandbox."
          : `Synced ${synced} EIS responses from sandbox.`,
    };
  } catch {
    return {
      error: "Could not sync EIS responses. Please try again.",
    };
  }
}
