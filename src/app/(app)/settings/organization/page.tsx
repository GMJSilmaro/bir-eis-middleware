import { OrganizationSettingsForm } from "@/features/settings/components/organization-settings-form";
import { SettingsContentCard } from "@/features/settings/components/settings-content-card";
import {
  hasPermission,
  requirePermission,
} from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export const metadata = {
  title: "Organization · Settings · BIR EIS",
};

export default async function OrganizationSettingsPage() {
  const session = await requirePermission("settings.view");
  const canManage = hasPermission(session.user.permissions, "settings.manage");

  const tenant = await prisma.tenant.findFirstOrThrow({
    where: { id: session.user.tenantId, deletedAt: null },
    select: { name: true, tagline: true, logo: true },
  });

  return (
    <SettingsContentCard
      title="Organization"
      description="Name and branding shown across your workspace."
    >
      <OrganizationSettingsForm
        key={[
          tenant.name,
          tenant.tagline ?? "",
          (tenant.logo ?? "").slice(0, 64),
          (tenant.logo ?? "").length,
        ].join("|")}
        canManage={canManage}
        initial={{
          name: tenant.name,
          tagline: tenant.tagline ?? "",
          logo: tenant.logo ?? "",
        }}
      />
    </SettingsContentCard>
  );
}
