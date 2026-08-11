import { Building2, Users } from "lucide-react";

import { prisma } from "@/lib/database/client";

export const metadata = {
  title: "Provider · BIR EIS",
  description: "Platform operator overview.",
};

export default async function ProviderOverviewPage() {
  const [tenantCount, userCount, activeTenantCount] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.tenant.count({ where: { deletedAt: null } }),
  ]);

  const kpis = [
    {
      label: "Active workspaces",
      value: activeTenantCount,
      hint: `${tenantCount} total including deactivated`,
      icon: Building2,
    },
    {
      label: "Active users",
      value: userCount,
      hint: "Across all workspaces",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Provision tenant workspaces and manage sign-in branding for the
          platform.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-xl border border-border/70 bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-3xl font-semibold tabular-nums tracking-tight">
                    {kpi.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{kpi.hint}</p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
