import Link from "next/link";

import { getEisSetupReadiness } from "@/features/bir-setup/lib/get-eis-setup-readiness";
import { overallStatusLabel } from "@/features/bir-setup/lib/compute-eis-setup-readiness";
import { Button } from "@/components/ui/button";

/** Compact readiness strip for Settings pages (Organization / wizard entry). */
export async function SettingsBirSetupStrip({ tenantId }: { tenantId: string }) {
  const readiness = await getEisSetupReadiness(tenantId);
  const done =
    readiness.status === "PRODUCTION_READY" ||
    readiness.status === "PRODUCTION_ENABLED";

  const step = readiness.nextRequiredStep ?? "organization";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 shadow-[0_4px_18px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div>
        <p className="text-sm font-semibold">BIR EIS Setup</p>
        <p className="text-sm text-muted-foreground">
          Status: {overallStatusLabel(readiness.status)}
          {done
            ? ""
            : ` · ${readiness.completedSteps} of ${readiness.totalRequiredSteps} stages completed`}
          {!done && readiness.blockingIssues.length > 0
            ? ` · ${readiness.blockingIssues.length} item(s) require attention`
            : ""}
        </p>
      </div>
      <Button asChild size="sm" variant={done ? "outline" : "default"}>
        <Link href={`/settings/bir-eis-setup?step=${step}`}>
          {done ? "Review Setup" : "Continue Setup"}
        </Link>
      </Button>
    </div>
  );
}
