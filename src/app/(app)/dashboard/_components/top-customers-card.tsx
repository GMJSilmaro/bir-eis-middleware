import { Users } from "lucide-react";

import { DashboardNavySurface } from "@/app/(app)/dashboard/_components/dashboard-navy-surface";
import { DEMO_TOP_CUSTOMERS } from "@/app/(app)/dashboard/_data/demo-invoices";
import { Card, CardContent } from "@/components/ui/card";

export function TopCustomersCard() {
  return (
    <Card className="overflow-hidden border-transparent shadow-[0_6px_24px_rgba(15,23,42,0.07)]">
      <DashboardNavySurface className="px-5 py-4">
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 size-5 shrink-0 text-sky-300" aria-hidden />
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight">
              Top Customers
            </h2>
            <p className="text-xs text-sidebar-muted">Most active clients.</p>
          </div>
        </div>
      </DashboardNavySurface>
      <CardContent className="px-5 py-4">
        <ul className="divide-y divide-border/60">
          {DEMO_TOP_CUSTOMERS.map((customer) => (
            <li
              key={customer.name}
              className="flex items-center gap-3 py-3.5 first:pt-2 last:pb-2"
            >
              <div
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--dashboard-navy-to))] text-sm font-semibold text-sidebar-foreground"
                aria-hidden
              >
                {customer.initials}
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate text-sm font-semibold text-foreground">
                  {customer.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {customer.invoiceCount.toLocaleString("en-PH")} invoices ·{" "}
                  {customer.amount}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold tabular-nums text-teal-700">
                {customer.invoiceCount.toLocaleString("en-PH")}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
