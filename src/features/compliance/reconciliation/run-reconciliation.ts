import { prisma } from "@/lib/database/client";
import type { Prisma } from "@/lib/database/generated/prisma/client";

export const RECONCILIATION_CODES = [
  "NEVER_TRANSMITTED",
  "NO_ACK",
  "UNRESOLVED_REJECT",
  "DUPLICATE_SOURCE",
  "STATUS_MISMATCH",
  "STALE_PENDING",
] as const;

export type ReconciliationCode = (typeof RECONCILIATION_CODES)[number];

export type ReconciliationFindingInput = {
  code: ReconciliationCode;
  severity: "warning" | "error";
  message: string;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
};

const STALE_HOURS = 24;

export async function runReconciliation(params: {
  tenantId: string;
  createdById?: string | null;
}): Promise<{
  checkId: string;
  findings: ReconciliationFindingInput[];
}> {
  const docs = await prisma.invoiceDocument.findMany({
    where: { tenantId: params.tenantId, deletedAt: null, direction: "outbound" },
    select: {
      id: true,
      documentNumber: true,
      status: true,
      eisAckStatus: true,
      sourceErpId: true,
      totalAmount: true,
      submittedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const findings: ReconciliationFindingInput[] = [];
  const staleBefore = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);

  const sourceCounts = new Map<string, number>();
  for (const doc of docs) {
    if (doc.sourceErpId) {
      sourceCounts.set(
        doc.sourceErpId,
        (sourceCounts.get(doc.sourceErpId) ?? 0) + 1,
      );
    }

    if (doc.status === "queued") {
      findings.push({
        code: "NEVER_TRANSMITTED",
        severity: "warning",
        message: `Invoice ${doc.documentNumber} is queued but not yet transmitted`,
        entityType: "invoice_document",
        entityId: doc.id,
      });
      if (doc.updatedAt < staleBefore) {
        findings.push({
          code: "STALE_PENDING",
          severity: "error",
          message: `Invoice ${doc.documentNumber} has been pending over ${STALE_HOURS}h`,
          entityType: "invoice_document",
          entityId: doc.id,
        });
      }
    }

    if (
      (doc.status === "submitted" || doc.submittedAt) &&
      (!doc.eisAckStatus || doc.eisAckStatus === "pending")
    ) {
      findings.push({
        code: "NO_ACK",
        severity: "error",
        message: `Invoice ${doc.documentNumber} transmitted without acknowledgement`,
        entityType: "invoice_document",
        entityId: doc.id,
      });
    }

    if (doc.status === "rejected" || doc.eisAckStatus === "rejected") {
      findings.push({
        code: "UNRESOLVED_REJECT",
        severity: "error",
        message: `Invoice ${doc.documentNumber} is rejected and unresolved`,
        entityType: "invoice_document",
        entityId: doc.id,
      });
    }

    if (
      doc.status === "accepted" &&
      doc.eisAckStatus &&
      doc.eisAckStatus !== "accepted"
    ) {
      findings.push({
        code: "STATUS_MISMATCH",
        severity: "error",
        message: `Invoice ${doc.documentNumber} status/ack mismatch`,
        entityType: "invoice_document",
        entityId: doc.id,
        metadata: { status: doc.status, eisAckStatus: doc.eisAckStatus },
      });
    }
  }

  for (const [sourceErpId, count] of sourceCounts) {
    if (count > 1) {
      findings.push({
        code: "DUPLICATE_SOURCE",
        severity: "error",
        message: `Source ERP id ${sourceErpId} appears ${count} times`,
        entityType: "source_erp_id",
        entityId: sourceErpId,
      });
    }
  }

  const check = await prisma.reconciliationCheck.create({
    data: {
      tenantId: params.tenantId,
      createdById: params.createdById ?? null,
      findingCount: findings.length,
      findings: {
        create: findings.map((f) => ({
          code: f.code,
          severity: f.severity,
          message: f.message,
          entityType: f.entityType ?? null,
          entityId: f.entityId ?? null,
          metadata: f.metadata ?? undefined,
        })),
      },
    },
  });

  return { checkId: check.id, findings };
}
