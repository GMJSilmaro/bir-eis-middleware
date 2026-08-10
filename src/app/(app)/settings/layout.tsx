import { Settings } from "lucide-react";

import { PageHeaderCard } from "@/app/(app)/_components/page-header-card";
import { SettingsSideNav } from "@/features/settings/components/settings-side-nav";
import { requirePermission } from "@/lib/auth/permissions";

export const metadata = {
  title: "Settings · BIR EIS",
};

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("settings.view");

  return (
    <div className="space-y-5">
      <PageHeaderCard
        icon={<Settings className="size-5" />}
        title="Settings"
        description="Manage your account, organization profile, and BIR EIS credential vault."
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-5 lg:gap-6">
        <SettingsSideNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
