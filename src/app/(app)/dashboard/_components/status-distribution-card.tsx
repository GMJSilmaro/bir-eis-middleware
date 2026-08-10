import { PieChart } from "lucide-react";

import { DashboardNavySurface } from "@/app/(app)/dashboard/_components/dashboard-navy-surface";
import { DEMO_STATUS_DISTRIBUTION } from "@/app/(app)/dashboard/_data/demo-invoices";
import { Card, CardContent } from "@/components/ui/card";

export interface StatusDistributionValues {
  accepted: number;
  rejected: number;
  pending: number;
}

const SEGMENT_META = [
  { key: "accepted" as const, label: "Accepted", color: "#14b8a6" },
  { key: "rejected" as const, label: "Rejected", color: "#ef4444" },
  { key: "pending" as const, label: "Pending", color: "#94a3b8" },
];

function conicGradient(values: StatusDistributionValues): string {
  let cursor = 0;
  const parts = SEGMENT_META.map((segment) => {
    const start = cursor;
    cursor += values[segment.key];
    return `${segment.color} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${parts.join(", ")})`;
}

export function StatusDistributionCard({
  values,
}: {
  values?: StatusDistributionValues | null;
}) {
  const distribution = values ?? DEMO_STATUS_DISTRIBUTION;
  const hasLiveData = Boolean(values);

  return (
    <Card className="overflow-hidden border-transparent shadow-[0_6px_24px_rgba(15,23,42,0.07)]">
      <DashboardNavySurface className="px-5 py-4">
        <div className="flex items-start gap-3">
          <PieChart
            className="mt-0.5 size-5 shrink-0 text-teal-300"
            aria-hidden
          />
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight">
              Status Distribution
            </h2>
            <p className="text-xs text-sidebar-muted">
              {hasLiveData
                ? "Outbound status breakdown."
                : "Invoice status breakdown."}
            </p>
          </div>
        </div>
      </DashboardNavySurface>
      <CardContent className="flex flex-col items-center gap-6 px-5 py-8">
        <div
          className="relative size-40 rounded-full shadow-inner"
          style={{ background: conicGradient(distribution) }}
          role="img"
          aria-label={`Accepted ${distribution.accepted}%, Rejected ${distribution.rejected}%, Pending ${distribution.pending}%`}
        >
          <div className="absolute inset-[18%] rounded-full bg-card shadow-sm" />
        </div>
        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {SEGMENT_META.map((segment) => (
            <li
              key={segment.key}
              className="inline-flex items-center gap-2 text-sm text-foreground"
            >
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: segment.color }}
                aria-hidden
              />
              <span className="font-medium">{segment.label}</span>
              <span className="tabular-nums text-muted-foreground">
                {distribution[segment.key]}%
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
