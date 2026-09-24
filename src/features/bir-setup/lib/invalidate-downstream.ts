import { ensureEisSetupState } from "@/features/bir-setup/lib/get-eis-setup-readiness";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { prisma } from "@/lib/database/client";
import { Prisma } from "@/lib/database/generated/prisma/client";

/**
 * When upstream configuration changes, invalidate downstream readiness.
 * Clears test/recon flags and marks wizard for revalidation.
 */
export async function invalidateDownstreamReadiness(params: {
  tenantId: string;
  userId?: string | null;
  reason: string;
  clearTestFlags?: boolean;
}) {
  const setup = await ensureEisSetupState(params.tenantId);

  await prisma.eisSetupState.update({
    where: { id: setup.id },
    data: {
      requiresRevalidation: true,
      revalidationReason: params.reason,
      discoveryResult: Prisma.DbNull,
      discoveryAt: null,
      qualityScanResult: Prisma.DbNull,
      qualityScanAt: null,
    },
  });

  if (params.clearTestFlags !== false) {
    const activation = await prisma.complianceActivation.findUnique({
      where: { tenantId: params.tenantId },
    });
    if (activation) {
      await prisma.complianceActivation.update({
        where: { id: activation.id },
        data: {
          testTransmissionPassed: false,
          reconciliationPassed: false,
          productionEnabled: false,
          productionEnabledAt: null,
          gateState: "DRAFT",
        },
      });
    }
  }

  await writeAuditLog({
    tenantId: params.tenantId,
    userId: params.userId ?? null,
    action: "READINESS_CHANGED",
    entityType: "eis_setup_state",
    entityId: setup.id,
    reason: params.reason,
    metadata: { requiresRevalidation: true },
  });
}

export async function clearRevalidationFlag(tenantId: string) {
  const setup = await ensureEisSetupState(tenantId);
  await prisma.eisSetupState.update({
    where: { id: setup.id },
    data: {
      requiresRevalidation: false,
      revalidationReason: null,
    },
  });
}
