import Link from "next/link";

import { CasRegistrationForms } from "@/features/compliance/components/cas-registration-forms";
import { ErpComplianceProfileForm } from "@/features/compliance/components/erp-compliance-profile-form";
import { SettingsContentCard } from "@/features/settings/components/settings-content-card";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export default async function ComplianceErpPage() {
  const session = await requirePermission("compliance.view");
  const tenantId = session.user.tenantId;
  const canEdit = hasPermission(
    session.user.permissions,
    "compliance.mapping.edit",
  );
  const canReview = hasPermission(
    session.user.permissions,
    "compliance.cas.review",
  );

  const [connections, casList] = await Promise.all([
    prisma.erpConnection.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.casRegistration.findMany({
      where: { tenantId },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-4">
      <SettingsContentCard
        title="ERP / CAS source systems"
        description="Register the accounting system that remains the system of record. Manage connection secrets under Settings → ERP."
      >
        {connections.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No ERP connections yet.{" "}
            <Link href="/settings/integrations/erp" className="underline">
              Add one in Settings
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-6">
            {connections.map((c) => (
              <ErpComplianceProfileForm
                key={c.id}
                canEdit={canEdit}
                connection={{
                  id: c.id,
                  name: c.name,
                  provider: c.provider,
                  vendor: c.vendor ?? "",
                  version: c.version ?? "",
                  systemType: c.systemType ?? "",
                  integrationMethod: c.integrationMethod ?? "",
                  scope: c.scope ?? "",
                  environment: c.environment ?? "test",
                  connectionVerified: c.connectionVerified,
                }}
              />
            ))}
          </div>
        )}
      </SettingsContentCard>

      <SettingsContentCard
        title="CAS registration evidence"
        description="Documentary evidence only. Uploading or reviewing here does not mean this application verified the certificate with BIR."
      >
        <CasRegistrationForms
          canEdit={canEdit}
          canReview={canReview}
          records={casList.map((r) => ({
            id: r.id,
            ackCertificateRef: r.ackCertificateRef ?? "",
            issuedAt: r.issuedAt
              ? r.issuedAt.toISOString().slice(0, 10)
              : "",
            registeredSystem: r.registeredSystem ?? "",
            systemVersion: r.systemVersion ?? "",
            rdoOffice: r.rdoOffice ?? "",
            applicability: r.applicability ?? "",
            status: r.status,
            notes: r.notes ?? "",
          }))}
        />
      </SettingsContentCard>
    </div>
  );
}
