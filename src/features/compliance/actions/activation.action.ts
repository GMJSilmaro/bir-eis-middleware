"use server";

import { revalidatePath } from "next/cache";

import {
  computeGateStateFromFacts,
  evaluateProductionGate,
} from "@/features/compliance/activation/gate";
import {
  ensureCertificationProfile,
  ensureComplianceActivation,
  loadComplianceContexts,
  runAndPersistTenantValidation,
} from "@/features/compliance/lib/compliance-queries";
import { unmappedRequiredFields } from "@/features/compliance/lib/field-mapping-defaults";
import { assessReadiness } from "@/features/compliance/readiness/assess-readiness";
import { runReconciliation } from "@/features/compliance/reconciliation/run-reconciliation";
import {
  enableProductionSchema,
  upsertCertificationProfileSchema,
} from "@/features/compliance/schemas/compliance.schema";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

import type { ComplianceActionState } from "./taxpayer.action";

export async function upsertCertificationProfileAction(
  _prev: ComplianceActionState,
  formData: FormData,
): Promise<ComplianceActionState> {
  const session = await requirePermission("compliance.certification.manage");
  const tenantId = session.user.tenantId;

  const parsed = upsertCertificationProfileSchema.safeParse({
    pttNumber: formData.get("pttNumber"),
    status: formData.get("status"),
    certPortalNote: formData.get("certPortalNote"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (parsed.data.status === "NOT_RECORDED") {
    // ok
  } else if (
    parsed.data.status === "RECORDED" ||
    parsed.data.status === "UNDER_REVIEW" ||
    parsed.data.status === "REVIEWED"
  ) {
    // never imply BIR verified
  }

  await ensureCertificationProfile(tenantId);
  const previous = await prisma.certificationProfile.findUnique({
    where: { tenantId },
  });

  const updated = await prisma.certificationProfile.update({
    where: { tenantId },
    data: {
      pttNumber: parsed.data.pttNumber || null,
      status: parsed.data.status,
      certPortalNote: parsed.data.certPortalNote || null,
      notes: parsed.data.notes || null,
      recordedById: session.user.id,
      recordedAt: new Date(),
    },
  });

  await writeAuditLog({
    tenantId,
    userId: session.user.id,
    action: "CONFIG_CHANGED",
    entityType: "certification_profile",
    entityId: updated.id,
    previousState: previous ?? undefined,
    newState: { status: updated.status, pttNumber: updated.pttNumber },
    reason:
      "Certification/PTT record updated (documentary — not BIR-verified by this app)",
  });

  revalidatePath("/compliance/readiness");
  return {
    success:
      "Certification / PTT record saved. This does not mean BIR approved or issued PTT through this app.",
  };
}

export async function runReconciliationAction(): Promise<ComplianceActionState> {
  const session = await requirePermission("compliance.validation.run");
  const tenantId = session.user.tenantId;

  const { checkId, findings } = await runReconciliation({
    tenantId,
    createdById: session.user.id,
  });

  const activation = await ensureComplianceActivation(tenantId);
  const passed = findings.filter((f) => f.severity === "error").length === 0;

  await prisma.complianceActivation.update({
    where: { id: activation.id },
    data: { reconciliationPassed: passed },
  });

  await writeAuditLog({
    tenantId,
    userId: session.user.id,
    action: "VALIDATION_RUN",
    entityType: "reconciliation_check",
    entityId: checkId,
    metadata: { findingCount: findings.length, passed },
  });

  revalidatePath("/compliance/reconciliation");
  revalidatePath("/compliance/readiness");

  return {
    success: passed
      ? "Reconciliation passed with no error-level findings."
      : `Reconciliation completed with ${findings.length} finding(s).`,
  };
}

export async function markTestTransmissionPassedAction(): Promise<ComplianceActionState> {
  const session = await requirePermission("compliance.submit");
  const tenantId = session.user.tenantId;

  const accepted = await prisma.invoiceDocument.findFirst({
    where: {
      tenantId,
      deletedAt: null,
      direction: "outbound",
      OR: [{ status: "accepted" }, { eisAckStatus: "accepted" }],
    },
    select: { id: true },
  });

  if (!accepted) {
    return {
      error:
        "No sandbox-accepted transmission found yet. Queue and sync a test invoice first.",
    };
  }

  const activation = await ensureComplianceActivation(tenantId);
  await prisma.complianceActivation.update({
    where: { id: activation.id },
    data: { testTransmissionPassed: true },
  });

  await writeAuditLog({
    tenantId,
    userId: session.user.id,
    action: "STATUS_CHANGED",
    entityType: "compliance_activation",
    entityId: activation.id,
    newState: { testTransmissionPassed: true },
    reason: "Sandbox test transmission recorded as passed",
  });

  revalidatePath("/compliance/readiness");
  return { success: "Sandbox test transmission marked as passed." };
}

export async function refreshActivationGateAction(): Promise<ComplianceActionState> {
  const session = await requirePermission("compliance.view");
  const tenantId = session.user.tenantId;
  await syncActivationFromFacts(tenantId, session.user.id);
  revalidatePath("/compliance/readiness");
  return { success: "Activation gate refreshed from current facts." };
}

export async function syncActivationFromFacts(
  tenantId: string,
  userId?: string,
) {
  const ctx = await loadComplianceContexts(tenantId);
  const { summary } = await runAndPersistTenantValidation({
    tenantId,
    scope: "readiness",
    createdById: userId ?? null,
  });

  const missing = unmappedRequiredFields(ctx.mappings);
  const taxpayerComplete =
    Boolean(ctx.taxpayer?.registeredName && ctx.taxpayer?.tin) &&
    ctx.taxpayer?.profileStatus === "REVIEWED";
  const casReviewed = ctx.cas?.status === "REVIEWED";
  const erpVerified = Boolean(ctx.erp?.connectionVerified);
  const mappingComplete = missing.length === 0 && ctx.mappings.length > 0;
  const validationPassed = !summary.hasBlockingFailure;
  const certificationRecorded =
    ctx.certification?.status === "RECORDED" ||
    ctx.certification?.status === "REVIEWED";

  const activation = await ensureComplianceActivation(tenantId);
  const gateState = computeGateStateFromFacts({
    taxpayerComplete,
    casReviewed,
    erpVerified,
    mappingComplete,
    validationPassed,
    testTransmissionPassed: activation.testTransmissionPassed,
    reconciliationPassed: activation.reconciliationPassed,
    certificationRecorded,
    productionEnabled: activation.productionEnabled,
  });

  await prisma.complianceActivation.update({
    where: { id: activation.id },
    data: { gateState },
  });

  return { gateState, summary, ctx };
}

export async function enableProductionAction(
  _prev: ComplianceActionState,
  formData: FormData,
): Promise<ComplianceActionState> {
  const session = await requirePermission("compliance.production.enable");
  const tenantId = session.user.tenantId;

  const parsed = enableProductionSchema.safeParse({
    override: formData.get("override") ?? "false",
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const synced = await syncActivationFromFacts(tenantId, session.user.id);
  const activation = await ensureComplianceActivation(tenantId);
  const missing = unmappedRequiredFields(synced.ctx.mappings);

  const gate = evaluateProductionGate({
    gateState: synced.gateState,
    productionEnabled: activation.productionEnabled,
    taxpayerComplete:
      Boolean(synced.ctx.taxpayer?.registeredName && synced.ctx.taxpayer?.tin) &&
      synced.ctx.taxpayer?.profileStatus === "REVIEWED",
    casReviewed: synced.ctx.cas?.status === "REVIEWED",
    erpVerified: Boolean(synced.ctx.erp?.connectionVerified),
    mappingComplete: missing.length === 0 && synced.ctx.mappings.length > 0,
    validationPassed: !synced.summary.hasBlockingFailure,
    testTransmissionPassed: activation.testTransmissionPassed,
    reconciliationPassed: activation.reconciliationPassed,
    certificationRecorded:
      synced.ctx.certification?.status === "RECORDED" ||
      synced.ctx.certification?.status === "REVIEWED",
  });

  const isOverride = parsed.data.override === "true";
  if (!gate.canEnableProduction) {
    if (!isOverride) {
      return {
        error: `Production blocked. ${gate.message}`,
      };
    }
    if (!parsed.data.reason?.trim()) {
      return { error: "Override requires a mandatory reason." };
    }
  }

  // Override cannot falsely mark certification as completed
  if (
    isOverride &&
    synced.ctx.certification?.status === "NOT_RECORDED"
  ) {
    // still allow production with audit, but certification stays NOT_RECORDED
  }

  const updated = await prisma.complianceActivation.update({
    where: { id: activation.id },
    data: {
      productionEnabled: true,
      productionEnabledAt: new Date(),
      gateState: "PRODUCTION_ENABLED",
      lastOverrideReason: isOverride ? parsed.data.reason : null,
      lastOverrideAt: isOverride ? new Date() : null,
      lastOverrideById: isOverride ? session.user.id : null,
    },
  });

  await writeAuditLog({
    tenantId,
    userId: session.user.id,
    action: "STATUS_CHANGED",
    entityType: "compliance_activation",
    entityId: updated.id,
    previousState: { productionEnabled: activation.productionEnabled },
    newState: { productionEnabled: true, override: isOverride },
    reason: isOverride
      ? parsed.data.reason
      : "Production enabled after readiness gates passed",
  });

  revalidatePath("/compliance/readiness");
  return {
    success: isOverride
      ? "Production enabled via audited override. Certification/PTT was not marked as BIR-verified."
      : "Production transmission enabled.",
  };
}

export async function buildReadinessForTenant(tenantId: string) {
  const ctx = await loadComplianceContexts(tenantId);
  const { summary } = await runAndPersistTenantValidation({
    tenantId,
    scope: "readiness",
  });
  const missing = unmappedRequiredFields(ctx.mappings);
  const activation = await ensureComplianceActivation(tenantId);

  const taxpayerOutcome =
    ctx.taxpayer?.profileStatus === "REVIEWED" &&
    ctx.taxpayer.registeredName &&
    ctx.taxpayer.tin
      ? ("PASS" as const)
      : ("FAIL" as const);

  const casOutcome =
    !ctx.cas || ctx.cas.status === "MISSING"
      ? ("FAIL" as const)
      : ctx.cas.status === "REVIEWED"
        ? ("PASS" as const)
        : ("WARNING" as const);

  return assessReadiness({
    taxpayerOutcome,
    casOutcome,
    erpConnected: Boolean(ctx.erp?.connectionVerified),
    mappingComplete: missing.length === 0 && ctx.mappings.length > 0,
    mappingMissingCount: missing.length,
    invoiceValidationOutcome: summary.hasBlockingFailure ? "FAIL" : "PASS",
    taxValidationOutcome: summary.hasBlockingFailure ? "FAIL" : "PASS",
    hasAuditTrail: ctx.hasAuditTrail,
    testTransmissionPassed: activation.testTransmissionPassed,
    reconciliationPassed: activation.reconciliationPassed,
    certificationStatus: ctx.certification?.status ?? "NOT_RECORDED",
    productionEnabled: activation.productionEnabled,
  });
}
