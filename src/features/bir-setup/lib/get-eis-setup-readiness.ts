import { buildReadinessForTenant } from "@/features/compliance/actions/activation.action";
import { unmappedRequiredFields } from "@/features/compliance/lib/field-mapping-defaults";
import { loadComplianceContexts } from "@/features/compliance/lib/compliance-queries";
import {
  computeEisSetupReadiness,
  type EisSetupReadiness,
} from "@/features/bir-setup/lib/compute-eis-setup-readiness";
import { prisma } from "@/lib/database/client";

export async function ensureEisSetupState(tenantId: string) {
  return prisma.eisSetupState.upsert({
    where: { tenantId },
    create: { tenantId, currentStepKey: "organization" },
    update: {},
  });
}

type DiscoveryResult = {
  fields?: Array<{ key: string; status: string }>;
  sampleCount?: number;
};

type QualityScanResult = {
  errors?: number;
  warnings?: number;
  summary?: Record<string, unknown>;
};

/**
 * Central readiness service used by Dashboard, Settings wizard, and production messaging.
 * Aggregates Tenant / Taxpayer / ERP / CAS / EisCredential / ComplianceActivation / EisSetupState.
 */
export async function getEisSetupReadiness(
  tenantId: string,
): Promise<EisSetupReadiness> {
  const [ctx, tenant, credential, setup, latestAccepted] = await Promise.all([
    loadComplianceContexts(tenantId),
    prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
      select: { name: true, logo: true },
    }),
    prisma.eisCredential.findFirst({
      where: { tenantId, deletedAt: null },
      select: {
        tin: true,
        pttNumber: true,
        pttStatus: true,
        apiKeyLast4: true,
        environment: true,
      },
    }),
    ensureEisSetupState(tenantId),
    prisma.invoiceDocument.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        OR: [{ status: "accepted" }, { eisAckStatus: "accepted" }],
      },
      orderBy: { eisAckAt: "desc" },
      select: { eisAckAt: true, submittedAt: true, updatedAt: true },
    }),
  ]);

  // Keep compliance readiness assessment warm for shared gate facts
  const assessment = await buildReadinessForTenant(tenantId);
  const missing = unmappedRequiredFields(ctx.mappings);

  const discovery = (setup.discoveryResult ?? null) as DiscoveryResult | null;
  const quality = (setup.qualityScanResult ?? null) as QualityScanResult | null;

  const taxpayerComplete =
    Boolean(ctx.taxpayer?.registeredName && ctx.taxpayer?.tin && ctx.taxpayer?.branchCode) &&
    ctx.taxpayer?.profileStatus === "REVIEWED";

  const credentialsConfigured = Boolean(
    credential?.tin &&
      credential.apiKeyLast4 &&
      (credential.pttNumber || credential.pttStatus !== "not_started"),
  );

  return computeEisSetupReadiness({
    organizationComplete: Boolean(tenant?.name?.trim()),
    organizationName: tenant?.name ?? null,
    taxpayerComplete,
    taxpayerWarning:
      Boolean(ctx.taxpayer?.registeredName && ctx.taxpayer?.tin) &&
      ctx.taxpayer?.profileStatus !== "REVIEWED",
    erpConfigured: Boolean(ctx.erp),
    erpConnected: Boolean(ctx.erp?.connectionVerified),
    erpLabel: ctx.erp?.name ?? ctx.erp?.vendor ?? null,
    casStatus: ctx.cas?.status ?? null,
    casReviewed: ctx.cas?.status === "REVIEWED",
    credentialsConfigured,
    credentialsPartial: Boolean(credential?.tin),
    environment:
      credential?.environment === "prod" || credential?.environment === "cert"
        ? credential.environment
        : null,
    discoveryComplete: Boolean(discovery && (discovery.fields?.length ?? 0) > 0),
    qualityHasErrors: Boolean(quality && (quality.errors ?? 0) > 0),
    qualityHasWarnings: Boolean(quality && (quality.warnings ?? 0) > 0),
    mappingComplete: missing.length === 0 && ctx.mappings.length > 0,
    mappingMissingCount: missing.length,
    validationPassed: assessment.categories
      .filter((c) => c.key === "invoice_validation" || c.key === "tax_validation")
      .every((c) => c.outcome === "PASS"),
    validationRun: assessment.categories.some(
      (c) =>
        (c.key === "invoice_validation" || c.key === "tax_validation") &&
        c.outcome !== "NOT_RUN",
    ),
    testTransmissionPassed: Boolean(ctx.activation?.testTransmissionPassed),
    reconciliationPassed: Boolean(ctx.activation?.reconciliationPassed),
    pttRecorded:
      ctx.certification?.status === "RECORDED" ||
      ctx.certification?.status === "REVIEWED",
    productionEnabled: Boolean(ctx.activation?.productionEnabled),
    requiresRevalidation: setup.requiresRevalidation,
    revalidationReason: setup.revalidationReason,
    wizardStartedAt: setup.wizardStartedAt,
    reminderDismissedAt: setup.reminderDismissedAt,
    completionAcknowledgedAt: setup.completionAcknowledgedAt,
    lastTestAt:
      latestAccepted?.eisAckAt ??
      latestAccepted?.submittedAt ??
      latestAccepted?.updatedAt ??
      null,
  });
}
