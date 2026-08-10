import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Building2,
  type LucideIcon,
} from "lucide-react";

import { DEMO_SUMMARY } from "@/app/(app)/dashboard/_data/demo-invoices";
import { Card, CardContent } from "@/components/ui/card";

const SUMMARY_ITEMS: {
  key: string;
  label: string;
  value: string;
  caption: string;
  icon: LucideIcon;
  accentClass: string;
}[] = [
  {
    key: "outbound",
    label: "OUTBOUND INVOICES",
    value: DEMO_SUMMARY.outbound.toLocaleString("en-PH"),
    caption: "TOTAL",
    icon: ArrowUpFromLine,
    accentClass: "border-t-sky-500",
  },
  {
    key: "inbound",
    label: "INBOUND INVOICES",
    value: DEMO_SUMMARY.inbound.toLocaleString("en-PH"),
    caption: "TOTAL",
    icon: ArrowDownToLine,
    accentClass: "border-t-teal-500",
  },
  {
    key: "companies",
    label: "COMPANIES REGISTERED",
    value: String(DEMO_SUMMARY.companies),
    caption: "ACTIVE",
    icon: Building2,
    accentClass: "border-t-blue-600",
  },
];

export function DashboardKpiCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5">
      {SUMMARY_ITEMS.map((item) => {
        const Icon = item.icon;

        return (
          <Card
            key={item.key}
            className={`border-transparent border-t-4 ${item.accentClass} shadow-[0_6px_24px_rgba(15,23,42,0.07)]`}
          >
            <CardContent className="flex items-center gap-4 px-5 py-5">
              <div
                className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                aria-hidden
              >
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-3xl font-bold leading-none tracking-tight tabular-nums text-foreground">
                  {item.value}
                </p>
                <p className="mt-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  {item.caption}
                </p>
              </div>
              <p className="max-w-[7.5rem] text-right text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                {item.label}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
