import { EisCredentialsForm } from "@/features/settings/components/eis-credentials-form";
import { SettingsContentCard } from "@/features/settings/components/settings-content-card";
import {
  hasPermission,
  requirePermission,
} from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export const metadata = {
  title: "EIS credentials · Settings · BIR EIS",
};

export default async function EisCredentialsSettingsPage() {
  const session = await requirePermission("settings.view");
  const canManage = hasPermission(session.user.permissions, "settings.manage");

  const credential = await prisma.eisCredential.findUnique({
    where: { tenantId: session.user.tenantId },
    select: {
      tin: true,
      environment: true,
      pttNumber: true,
      pttStatus: true,
      apiKeyLast4: true,
      notes: true,
      deletedAt: true,
    },
  });

  const activeCredential =
    credential && !credential.deletedAt ? credential : null;

  return (
    <SettingsContentCard
      title="EIS credentials"
      description="TIN, environment, PTT details, and API key for BIR EIS. Keys are encrypted at rest and masked after save."
    >
      <EisCredentialsForm
        key={[
          activeCredential?.tin ?? "",
          activeCredential?.environment ?? "cert",
          activeCredential?.pttNumber ?? "",
          activeCredential?.pttStatus ?? "not_started",
          activeCredential?.apiKeyLast4 ?? "",
          activeCredential?.notes ?? "",
        ].join("|")}
        canManage={canManage}
        initial={{
          tin: activeCredential?.tin ?? "",
          environment: activeCredential?.environment ?? "cert",
          pttNumber: activeCredential?.pttNumber ?? "",
          pttStatus: activeCredential?.pttStatus ?? "not_started",
          apiKeyLast4: activeCredential?.apiKeyLast4 ?? null,
          notes: activeCredential?.notes ?? "",
        }}
      />
    </SettingsContentCard>
  );
}
