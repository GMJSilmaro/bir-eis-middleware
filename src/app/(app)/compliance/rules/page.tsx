import { COMPLIANCE_RULES } from "@/features/compliance/rules/registry";
import { SettingsContentCard } from "@/features/settings/components/settings-content-card";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export default async function ComplianceRulesPage() {
  const session = await requirePermission("compliance.view");
  const recent = await prisma.complianceValidationRun.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { results: true },
  });

  return (
    <div className="space-y-4">
      <SettingsContentCard
        title="Validation rules"
        description="Centralized compliance rules reused for onboarding, invoice, batch, pre-transmission, and readiness checks."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-2 font-medium">Code</th>
                <th className="py-2 pr-2 font-medium">Category</th>
                <th className="py-2 pr-2 font-medium">Blocking</th>
                <th className="py-2 pr-2 font-medium">Reference</th>
                <th className="py-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {COMPLIANCE_RULES.map((rule) => (
                <tr key={rule.code} className="border-b border-border/60 align-top">
                  <td className="py-2 pr-2 font-mono text-xs">{rule.code}</td>
                  <td className="py-2 pr-2">{rule.category}</td>
                  <td className="py-2 pr-2">{rule.blocking ? "Yes" : "No"}</td>
                  <td className="py-2 pr-2 text-xs">{rule.regulatoryReference}</td>
                  <td className="py-2">{rule.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsContentCard>

      <SettingsContentCard
        title="Recent validation runs"
        description="Persisted outcomes from the shared rule engine."
      >
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No validation runs yet.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {recent.map((run) => (
              <li key={run.id} className="rounded-md border border-border/70 px-3 py-2">
                <p className="font-medium">
                  {run.scope} · {run.overallOutcome} · blocking{" "}
                  {run.blockingFailureCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  {run.createdAt.toISOString()} · rules {run.ruleVersion}
                </p>
              </li>
            ))}
          </ul>
        )}
      </SettingsContentCard>
    </div>
  );
}
