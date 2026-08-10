import { Gauge } from "lucide-react";

import { PageHeaderCard } from "@/app/(app)/_components/page-header-card";
import { BirEisSystemStatus } from "@/app/(app)/dashboard/_components/bir-eis-system-status";
import { DashboardKpiCards } from "@/app/(app)/dashboard/_components/dashboard-kpi-cards";
import { StatusDistributionCard } from "@/app/(app)/dashboard/_components/status-distribution-card";
import { TopCustomersCard } from "@/app/(app)/dashboard/_components/top-customers-card";
import { requireAuth } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export const metadata = {
  title: "Dashboard · BIR EIS",
};

export default async function DashboardPage() {
  const session = await requireAuth();

  const userCount = await prisma.user.count({
    where: { tenantId: session.user.tenantId, deletedAt: null },
  });

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeaderCard
        icon={<Gauge className="size-5" />}
        title="Dashboard Overview"
        description="Monitor your e-invoice activities and manage your transactions efficiently."
        showLiveClock
      />
      <DashboardKpiCards />
      <div className="grid gap-5 xl:grid-cols-3">
        <StatusDistributionCard />
        <TopCustomersCard />
        <BirEisSystemStatus registeredUsers={userCount} />
      </div>
    </div>
  );
}
