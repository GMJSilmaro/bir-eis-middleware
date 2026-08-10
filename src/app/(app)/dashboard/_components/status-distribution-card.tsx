import { PieChart } from "lucide-react";

import { DashboardNavySurface } from "@/app/(app)/dashboard/_components/dashboard-navy-surface";
import { DEMO_STATUS_DISTRIBUTION } from "@/app/(app)/dashboard/_data/demo-invoices";
import { Card, CardContent } from "@/components/ui/card";

const SEGMENTS = [
  {
    key: "accepted",
    label: "Accepted",
    value: DEMO_STATUS_DISTRIBUTION.accepted,
    color: "#14b8a6",
  },
  {
    key: "rejected",
    label: "Rejected",
    value: DEMO_STATUS_DISTRIBUTION.rejected,
    color: "#ef4444",
  },
  {
    key: "pending",
    label: "Pending",
    value: DEMO_STATUS_DISTRIBUTION.pending,
    color: "#94a3b8",
  },
] as const;

function conicGradient(): string {
  let cursor = 0;
  const parts = SEGMENTS.map((segment) => {
    const start = cursor;
    cursor += segment.value;
    return `${segment.color} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${parts.join(", ")})`;
}

export function StatusDistributionCard() {
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
              Invoice status breakdown.
            </p>
          </div>
        </div>
      </DashboardNavySurface>
      <CardContent className="flex flex-col items-center gap-6 px-5 py-8">
        <div
          className="relative size-40 rounded-full shadow-inner"
          style={{ background: conicGradient() }}
          role="img"
          aria-label={`Accepted ${DEMO_STATUS_DISTRIBUTION.accepted}%, Rejected ${DEMO_STATUS_DISTRIBUTION.rejected}%, Pending ${DEMO_STATUS_DISTRIBUTION.pending}%`}
        >
          <div className="absolute inset-[18%] rounded-full bg-card shadow-sm" />
        </div>
        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {SEGMENTS.map((segment) => (
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
                {segment.value}%
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
