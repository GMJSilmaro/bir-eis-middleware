import { buildReadinessForTenant } from "@/features/compliance/actions/activation.action";
import { ReadinessPanel } from "@/features/compliance/components/readiness-panel";
import {
  ensureCertificationProfile,
  ensureComplianceActivation,
} from "@/features/compliance/lib/compliance-queries";
import { SettingsContentCard } from "@/features/settings/components/settings-content-card";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";

export default async function ComplianceReadinessPage() {
  const session = await requirePermission("compliance.view");
  const tenantId = session.user.tenantId;

  const [assessment, activation, certification] = await Promise.all([
    buildReadinessForTenant(tenantId),
    ensureComplianceActivation(tenantId),
    ensureCertificationProfile(tenantId),
  ]);

  return (
    <SettingsContentCard
      title="EIS Integration Readiness"
      description="Internal readiness for EIS transmission. Not BIR Certified, Approved, or Accredited."
    >
      <ReadinessPanel
        assessment={assessment}
        gateState={activation.gateState}
        productionEnabled={activation.productionEnabled}
        certification={{
          pttNumber: certification.pttNumber ?? "",
          status: certification.status,
          certPortalNote: certification.certPortalNote ?? "",
          notes: certification.notes ?? "",
        }}
        canValidate={hasPermission(
          session.user.permissions,
          "compliance.validation.run",
        )}
        canSubmit={hasPermission(session.user.permissions, "compliance.submit")}
        canManageCert={hasPermission(
          session.user.permissions,
          "compliance.certification.manage",
        )}
        canEnableProduction={hasPermission(
          session.user.permissions,
          "compliance.production.enable",
        )}
      />
    </SettingsContentCard>
  );
}
