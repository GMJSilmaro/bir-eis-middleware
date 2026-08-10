import {
  toNullableNotes,
  toNullableTin,
} from "@/features/documents/lib/document-form-data";
import { documentNumberExists } from "@/features/documents/lib/document-queries";
import { createOutboundDocumentSchema } from "@/features/documents/schemas/document.schema";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { prisma } from "@/lib/database/client";

export type IngestDraftSource = "import" | "erp_sync";

export type IngestRowInput = {
  /** 1-based row number for UI error reporting (CSV data row or ERP sample index). */
  row: number;
  fields: Record<string, string>;
};

export type IngestRowError = {
  row: number;
  message: string;
};

export type CreateOutboundDraftsResult = {
  created: number;
  skipped: number;
  errors: IngestRowError[];
  createdIds: string[];
};

/**
 * Validate portal-shaped rows, skip duplicate document numbers, create outbound drafts.
 */
export async function createOutboundDrafts(params: {
  tenantId: string;
  userId: string;
  rows: IngestRowInput[];
  source: IngestDraftSource;
}): Promise<CreateOutboundDraftsResult> {
  const { tenantId, userId, rows, source } = params;
  const errors: IngestRowError[] = [];
  const createdIds: string[] = [];
  let skipped = 0;
  const seenInBatch = new Set<string>();

  const auditAction =
    source === "import" ? "document.imported" : "document.created";

  for (const item of rows) {
    const parsed = createOutboundDocumentSchema.safeParse({
      documentType: item.fields.documentType,
      documentNumber: item.fields.documentNumber,
      issueDate: item.fields.issueDate,
      currency: item.fields.currency || "PHP",
      counterpartName: item.fields.counterpartName,
      counterpartTin: item.fields.counterpartTin ?? "",
      lineExtensionAmount: item.fields.lineExtensionAmount,
      taxAmount: item.fields.taxAmount,
      totalAmount: item.fields.totalAmount,
      notes: item.fields.notes ?? "",
    });

    if (!parsed.success) {
      errors.push({
        row: item.row,
        message: parsed.error.issues[0]?.message ?? "Invalid row",
      });
      continue;
    }

    const data = parsed.data;
    const numberKey = data.documentNumber.toLowerCase();

    if (seenInBatch.has(numberKey)) {
      skipped += 1;
      errors.push({
        row: item.row,
        message: `Skipped duplicate document number in this batch: ${data.documentNumber}`,
      });
      continue;
    }

    const duplicate = await documentNumberExists({
      tenantId,
      direction: "outbound",
      documentNumber: data.documentNumber,
    });
    if (duplicate) {
      skipped += 1;
      errors.push({
        row: item.row,
        message: `Skipped — outbound document ${data.documentNumber} already exists`,
      });
      continue;
    }

    try {
      const created = await prisma.invoiceDocument.create({
        data: {
          tenantId,
          createdById: userId,
          direction: "outbound",
          status: "draft",
          documentType: data.documentType,
          documentNumber: data.documentNumber,
          issueDate: new Date(data.issueDate),
          currency: data.currency.toUpperCase(),
          counterpartName: data.counterpartName,
          counterpartTin: toNullableTin(data.counterpartTin),
          lineExtensionAmount: data.lineExtensionAmount,
          taxAmount: data.taxAmount,
          totalAmount: data.totalAmount,
          notes: toNullableNotes(data.notes),
        },
        select: { id: true, documentNumber: true },
      });

      seenInBatch.add(numberKey);
      createdIds.push(created.id);

      await writeAuditLog({
        tenantId,
        userId,
        action: auditAction,
        entityType: "invoice_document",
        entityId: created.id,
        metadata: {
          direction: "outbound",
          documentNumber: created.documentNumber,
          status: "draft",
          source,
        },
      });
    } catch {
      errors.push({
        row: item.row,
        message: "Could not create draft for this row",
      });
    }
  }

  return {
    created: createdIds.length,
    skipped,
    errors,
    createdIds,
  };
}
