import { ProfileSettingsForm } from "@/features/settings/components/profile-settings-form";
import { SettingsContentCard } from "@/features/settings/components/settings-content-card";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export const metadata = {
  title: "Personal Information · Settings · BIR EIS",
};

export default async function ProfileSettingsPage() {
  const session = await requirePermission("settings.view");

  const user = await prisma.user.findFirstOrThrow({
    where: {
      id: session.user.id,
      tenantId: session.user.tenantId,
      deletedAt: null,
    },
    select: {
      name: true,
      email: true,
      image: true,
      userRoles: {
        select: { role: { select: { name: true } } },
      },
    },
  });

  const roleLabel =
    user.userRoles
      .map((entry) => entry.role.name)
      .sort((a, b) => a.localeCompare(b))
      .join(", ") || "Member";

  return (
    <SettingsContentCard
      title="Personal Information"
      description="Your photo, name, and account details for this workspace."
    >
      <ProfileSettingsForm
        key={`${user.name}|${user.email}|${roleLabel}|${user.image ?? ""}`}
        initial={{
          name: user.name,
          email: user.email,
          roleLabel,
          image: user.image ?? "",
        }}
      />
    </SettingsContentCard>
  );
}
