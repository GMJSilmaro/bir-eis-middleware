"use server";

import { revalidatePath } from "next/cache";

import {
  ensureTaxpayerProfile,
  loadComplianceContexts,
  runAndPersistTenantValidation,
} from "@/features/compliance/lib/compliance-queries";
import { upsertTaxpayerProfileSchema } from "@/features/compliance/schemas/compliance.schema";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export type ComplianceActionState = {
  error?: string;
  success?: string;
};

export async function upsertTaxpayerProfileAction(
  _prev: ComplianceActionState,
  formData: FormData,
): Promise<ComplianceActionState> {
  const session = await requirePermission("compliance.taxpayer.edit");
  const tenantId = session.user.tenantId;

  const parsed = upsertTaxpayerProfileSchema.safeParse({
    registeredName: formData.get("registeredName"),
    tin: formData.get("tin"),
    branchCode: formData.get("branchCode"),
    officeType: formData.get("officeType"),
    rdoCode: formData.get("rdoCode"),
    classification: formData.get("classification"),
    vatMode: formData.get("vatMode"),
    businessAddress: formData.get("businessAddress"),
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    profileStatus: formData.get("profileStatus"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  await ensureTaxpayerProfile(tenantId);
  const previous = await prisma.taxpayerProfile.findUnique({
    where: { tenantId },
  });

  const updated = await prisma.taxpayerProfile.update({
    where: { tenantId },
    data: {
      registeredName: data.registeredName,
      tin: data.tin,
      branchCode: data.branchCode,
      officeType: data.officeType,
      rdoCode: data.rdoCode || null,
      classification: data.classification || null,
      vatMode: data.vatMode,
      businessAddress: data.businessAddress || null,
      contactName: data.contactName || null,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
      profileStatus: data.profileStatus,
      notes: data.notes || null,
    },
  });

  await writeAuditLog({
    tenantId,
    userId: session.user.id,
    action: "CONFIG_CHANGED",
    entityType: "taxpayer_profile",
    entityId: updated.id,
    previousState: previous ?? undefined,
    newState: updated,
    reason: "Taxpayer compliance profile updated",
  });

  revalidatePath("/compliance");
  revalidatePath("/compliance/taxpayer");
  revalidatePath("/compliance/readiness");
  return {
    success:
      "Taxpayer profile saved. Status reflects internal review only — not BIR verification.",
  };
}

export async function runOnboardingValidationAction(): Promise<ComplianceActionState> {
  const session = await requirePermission("compliance.validation.run");
  const tenantId = session.user.tenantId;

  const { summary } = await runAndPersistTenantValidation({
    tenantId,
    scope: "onboarding",
    createdById: session.user.id,
  });

  await writeAuditLog({
    tenantId,
    userId: session.user.id,
    action: "VALIDATION_RUN",
    entityType: "compliance_validation",
    metadata: {
      scope: "onboarding",
      outcome: summary.overallOutcome,
      blocking: summary.blockingFailureCount,
    },
  });

  revalidatePath("/compliance");
  revalidatePath("/compliance/readiness");
  revalidatePath("/compliance/rules");

  if (summary.hasBlockingFailure) {
    return {
      error: `Validation failed with ${summary.blockingFailureCount} blocking issue(s).`,
    };
  }
  return { success: `Validation ${summary.overallOutcome}` };
}

export async function getComplianceOverviewData(tenantId: string) {
  return loadComplianceContexts(tenantId);
}
