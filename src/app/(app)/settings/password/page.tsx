import { ChangePasswordForm } from "@/features/settings/components/change-password-form";
import { SettingsContentCard } from "@/features/settings/components/settings-content-card";
import { requirePermission } from "@/lib/auth/permissions";

export const metadata = {
  title: "Change Password · Settings · BIR EIS",
};

export default async function ChangePasswordSettingsPage() {
  await requirePermission("settings.view");

  return (
    <SettingsContentCard
      title="Change Password"
      description="Update the password you use to sign in to BIR EIS."
    >
      <ChangePasswordForm />
    </SettingsContentCard>
  );
}
