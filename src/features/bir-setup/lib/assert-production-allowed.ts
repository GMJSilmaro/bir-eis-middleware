import { getEisSetupReadiness } from "@/features/bir-setup/lib/get-eis-setup-readiness";
import { overallStatusLabel } from "@/features/bir-setup/lib/compute-eis-setup-readiness";

/**
 * Server-side production transmission gate with actionable blocking details.
 * UX reminders never bypass this check.
 */
export async function assertProductionAllowed(tenantId: string): Promise<{
  allowed: boolean;
  message: string;
  blockingIssues: string[];
  statusLabel: string;
}> {
  const readiness = await getEisSetupReadiness(tenantId);
  const statusLabel = overallStatusLabel(readiness.status);

  if (readiness.productionEnabled && !readiness.requiresRevalidation) {
    return {
      allowed: true,
      message: "Production transmission is enabled for this workspace.",
      blockingIssues: [],
      statusLabel,
    };
  }

  if (readiness.productionAllowed && !readiness.productionEnabled) {
    return {
      allowed: false,
      message:
        "EIS integration readiness requirements have passed, but production transmission has not been enabled yet.",
      blockingIssues: [
        "Open BIR EIS Setup → Production Readiness and enable production transmission.",
      ],
      statusLabel,
    };
  }

  return {
    allowed: false,
    message:
      "Production transmission is not available because your BIR EIS integration setup has unresolved requirements.",
    blockingIssues: readiness.blockingIssues,
    statusLabel,
  };
}
