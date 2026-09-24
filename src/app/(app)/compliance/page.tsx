import Link from "next/link";

import { SettingsContentCard } from "@/features/settings/components/settings-content-card";
import { loadComplianceContexts } from "@/features/compliance/lib/compliance-queries";
import { requirePermission } from "@/lib/auth/permissions";

const FLOW_STEPS = [
  "ERP / CAS",
  "Data Mapping",
  "Compliance Validation",
  "EIS Transmission",
  "BIR Response",
  "Reconciliation",
] as const;

export default async function ComplianceOverviewPage() {
  const session = await requirePermission("compliance.view");
  const ctx = await loadComplianceContexts(session.user.tenantId);

  return (
    <div className="space-y-4">
      <SettingsContentCard
        title="Integration flow"
        description="Your ERP remains the system of record. This middleware validates, transmits, and reconciles."
      >
        <ol className="flex flex-col gap-0 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          {FLOW_STEPS.map((step, index) => (
            <li key={step} className="flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground">{step}</span>
              {index < FLOW_STEPS.length - 1 ? (
                <span className="hidden text-muted-foreground sm:inline" aria-hidden>
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-muted-foreground">
          Passing internal readiness does not mean BIR approval, CAS registration,
          accreditation, or issuance of a Permit to Transmit.
        </p>
      </SettingsContentCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryTile
          label="Taxpayer profile"
          value={ctx.taxpayer?.profileStatus ?? "NOT_PROVIDED"}
          href="/compliance/taxpayer"
        />
        <SummaryTile
          label="CAS documentation"
          value={ctx.cas?.status ?? "MISSING"}
          href="/compliance/erp"
        />
        <SummaryTile
          label="Field mappings"
          value={`${ctx.mappings.length} mapped`}
          href="/compliance/mapping"
        />
        <SummaryTile
          label="Activation gate"
          value={ctx.activation?.gateState ?? "DRAFT"}
          href="/compliance/readiness"
        />
        <SummaryTile
          label="Production"
          value={ctx.activation?.productionEnabled ? "Enabled" : "Disabled"}
          href="/compliance/readiness"
        />
        <SummaryTile
          label="Certification / PTT record"
          value={ctx.certification?.status ?? "NOT_RECORDED"}
          href="/compliance/readiness"
        />
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:bg-muted/40"
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </Link>
  );
}
