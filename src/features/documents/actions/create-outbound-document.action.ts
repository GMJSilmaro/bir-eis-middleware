"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  readDocumentFormFields,
  toNullableNotes,
  toNullableTin,
} from "@/features/documents/lib/document-form-data";
import { documentNumberExists } from "@/features/documents/lib/document-queries";
import { createOutboundDocumentSchema } from "@/features/documents/schemas/document.schema";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export type DocumentActionState = {
  error?: string;
  success?: boolean;
  message?: string;
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

  let createdId: string;
  try {
    const created = await prisma.invoiceDocument.create({
      data: {
        tenantId,
        createdById: session.user.id,
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
      },
    });

    createdId = created.id;
  } catch {
    return { error: "Could not create the document. Please try again." };
  }

  revalidatePath("/outbound");
  revalidatePath("/dashboard");
  redirect(`/outbound/${createdId}`);
}
