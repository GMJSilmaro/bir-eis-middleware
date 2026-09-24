"use server";

import { revalidatePath } from "next/cache";

import {
  reviewCasRegistrationSchema,
  upsertCasRegistrationSchema,
} from "@/features/compliance/schemas/compliance.schema";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

import type { ComplianceActionState } from "./taxpayer.action";

export async function upsertCasRegistrationAction(
  _prev: ComplianceActionState,
  formData: FormData,
): Promise<ComplianceActionState> {
  const session = await requirePermission("compliance.taxpayer.edit");
  const tenantId = session.user.tenantId;

  const parsed = upsertCasRegistrationSchema.safeParse({
    id: formData.get("id"),
    ackCertificateRef: formData.get("ackCertificateRef"),
    issuedAt: formData.get("issuedAt"),
    registeredSystem: formData.get("registeredSystem"),
    systemVersion: formData.get("systemVersion"),
    rdoOffice: formData.get("rdoOffice"),
    applicability: formData.get("applicability"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const status =
    data.status === "MISSING" && data.ackCertificateRef
      ? "PROVIDED"
      : data.status;

  let record;
  if (data.id) {
    const existing = await prisma.casRegistration.findFirst({
      where: { id: data.id, tenantId },
    });
    if (!existing) return { error: "CAS registration not found." };
    record = await prisma.casRegistration.update({
      where: { id: existing.id },
      data: {
        ackCertificateRef: data.ackCertificateRef || null,
        issuedAt: data.issuedAt ? new Date(data.issuedAt) : null,
        registeredSystem: data.registeredSystem || null,
        systemVersion: data.systemVersion || null,
        rdoOffice: data.rdoOffice || null,
        applicability: data.applicability || null,
        status,
        notes: data.notes || null,
      },
    });
  } else {
    record = await prisma.casRegistration.create({
      data: {
        tenantId,
        ackCertificateRef: data.ackCertificateRef || null,
        issuedAt: data.issuedAt ? new Date(data.issuedAt) : null,
        registeredSystem: data.registeredSystem || null,
        systemVersion: data.systemVersion || null,
        rdoOffice: data.rdoOffice || null,
        applicability: data.applicability || null,
        status,
        notes: data.notes || null,
      },
    });
  }

  await writeAuditLog({
    tenantId,
    userId: session.user.id,
    action: "DOCUMENT_UPLOADED",
    entityType: "cas_registration",
    entityId: record.id,
    newState: { status: record.status, ref: record.ackCertificateRef },
    reason: "CAS registration evidence updated",
  });

  revalidatePath("/compliance/erp");
  revalidatePath("/compliance/readiness");
  return {
    success:
      "CAS registration saved. Uploading evidence does not mean this app verified it with BIR.",
  };
}

export async function reviewCasRegistrationAction(
  _prev: ComplianceActionState,
  formData: FormData,
): Promise<ComplianceActionState> {
  const session = await requirePermission("compliance.cas.review");
  const tenantId = session.user.tenantId;

  const parsed = reviewCasRegistrationSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.casRegistration.findFirst({
    where: { id: parsed.data.id, tenantId },
  });
  if (!existing) return { error: "CAS registration not found." };

  const updated = await prisma.casRegistration.update({
    where: { id: existing.id },
    data: {
      status: parsed.data.status,
      notes: parsed.data.notes || existing.notes,
      reviewerId: session.user.id,
      reviewedAt: new Date(),
    },
  });

  await writeAuditLog({
    tenantId,
    userId: session.user.id,
    action: "DOCUMENT_REVIEWED",
    entityType: "cas_registration",
    entityId: updated.id,
    previousState: { status: existing.status },
    newState: { status: updated.status },
    reason: parsed.data.notes || "CAS documentation reviewed",
  });

  revalidatePath("/compliance/erp");
  revalidatePath("/compliance/readiness");
  return {
    success:
      "Internal review recorded. This is not a BIR verification or accreditation.",
  };
}

export async function uploadComplianceDocumentAction(
  _prev: ComplianceActionState,
  formData: FormData,
): Promise<ComplianceActionState> {
  const session = await requirePermission("compliance.taxpayer.edit");
  const tenantId = session.user.tenantId;

  const entityType = String(formData.get("entityType") ?? "");
  const entityId = String(formData.get("entityId") ?? "");
  const file = formData.get("file");

  if (!entityType || !entityId) {
    return { error: "Entity is required for document upload." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (file.size > 2_000_000) {
    return { error: "File must be under 2 MB." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const doc = await prisma.complianceDocument.create({
    data: {
      tenantId,
      entityType,
      entityId,
      fileName: file.name.slice(0, 200),
      mimeType: file.type || "application/octet-stream",
      contentBase64: buffer.toString("base64"),
      byteSize: buffer.length,
      uploadedById: session.user.id,
    },
  });

  await writeAuditLog({
    tenantId,
    userId: session.user.id,
    action: "DOCUMENT_UPLOADED",
    entityType: "compliance_document",
    entityId: doc.id,
    metadata: { fileName: doc.fileName, parentEntity: entityType, parentId: entityId },
  });

  revalidatePath("/compliance/erp");
  return { success: "Supporting document stored." };
}
