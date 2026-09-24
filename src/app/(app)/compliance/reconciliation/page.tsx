import { RunReconciliationButton } from "@/features/compliance/components/run-reconciliation-button";
import { SettingsContentCard } from "@/features/settings/components/settings-content-card";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export default async function ComplianceReconciliationPage() {
  const session = await requirePermission("compliance.view");
  const checks = await prisma.reconciliationCheck.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { findings: true },
  });

  return (
    <SettingsContentCard
      title="Reconciliation"
      description="Compare ERP source, middleware state, and EIS acknowledgements. HTTP 200 alone does not mean compliant."
    >
      <div className="mb-4">
        <RunReconciliationButton
          canRun={hasPermission(
            session.user.permissions,
            "compliance.validation.run",
          )}
        />
      </div>
      {checks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reconciliation runs yet.</p>
      ) : (
        <ul className="space-y-4">
          {checks.map((check) => (
            <li key={check.id} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">
                {check.createdAt.toISOString()} · {check.findingCount} finding(s)
              </p>
              {check.findings.length === 0 ? (
                <p className="mt-1 text-sm text-emerald-700">No findings</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {check.findings.map((f) => (
                    <li key={f.id}>
                      <span className="font-mono text-xs">{f.code}</span> ·{" "}
                      {f.severity}: {f.message}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </SettingsContentCard>
  );
}
