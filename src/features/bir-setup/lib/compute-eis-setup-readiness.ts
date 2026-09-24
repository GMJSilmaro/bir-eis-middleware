import type {
  BirSetupOverallStatus,
  BirSetupStepKey,
  BirSetupStepStatus,
} from "@/features/bir-setup/lib/step-definitions";
import { BIR_SETUP_STEPS } from "@/features/bir-setup/lib/step-definitions";

export type EisSetupStepResult = {
  key: BirSetupStepKey;
  title: string;
  shortTitle: string;
  status: BirSetupStepStatus;
  message: string;
  blocking: boolean;
  href?: string;
};

export type EisSetupReadiness = {
  status: BirSetupOverallStatus;
  completedSteps: number;
  totalRequiredSteps: number;
  nextRequiredStep: BirSetupStepKey | null;
  steps: EisSetupStepResult[];
  blockingIssues: string[];
  warnings: string[];
  requiresRevalidation: boolean;
  revalidationReason: string | null;
  productionAllowed: boolean;
  productionEnabled: boolean;
  environment: "cert" | "prod" | null;
  erpLabel: string | null;
  erpConnected: boolean;
  validationPassed: boolean;
  lastTestAt: string | null;
  wizardStarted: boolean;
  reminderDismissedAt: string | null;
  completionAcknowledgedAt: string | null;
  discoveryComplete: boolean;
  qualityHasErrors: boolean;
};

export type EisSetupFacts = {
  organizationComplete: boolean;
  organizationName: string | null;
  taxpayerComplete: boolean;
  taxpayerWarning: boolean;
  erpConfigured: boolean;
  erpConnected: boolean;
  erpLabel: string | null;
  casStatus: string | null;
  casReviewed: boolean;
  credentialsConfigured: boolean;
  credentialsPartial: boolean;
  environment: "cert" | "prod" | null;
  discoveryComplete: boolean;
  qualityHasErrors: boolean;
  qualityHasWarnings: boolean;
  mappingComplete: boolean;
  mappingMissingCount: number;
  validationPassed: boolean;
  validationRun: boolean;
  testTransmissionPassed: boolean;
  reconciliationPassed: boolean;
  pttRecorded: boolean;
  productionEnabled: boolean;
  requiresRevalidation: boolean;
  revalidationReason: string | null;
  wizardStartedAt: Date | null;
  reminderDismissedAt: Date | null;
  completionAcknowledgedAt: Date | null;
  lastTestAt: Date | null;
};

function stepStatus(params: {
  complete: boolean;
  warning?: boolean;
  started?: boolean;
  needsRecheck?: boolean;
  blocked?: boolean;
}): BirSetupStepStatus {
  if (params.needsRecheck) return "NEEDS_RECHECK";
  if (params.blocked) return "BLOCKED";
  if (params.complete && params.warning) return "WARNING";
  if (params.complete) return "COMPLETE";
  if (params.started) return "INCOMPLETE";
  return "NOT_STARTED";
}

/**
 * Pure readiness aggregation for the BIR EIS Setup wizard + dashboard.
 * Domain facts come from Tenant / Taxpayer / ERP / CAS / EisCredential / ComplianceActivation.
 */
export function computeEisSetupReadiness(facts: EisSetupFacts): EisSetupReadiness {
  const recheck = facts.requiresRevalidation;

  const steps: EisSetupStepResult[] = [
    {
      key: "organization",
      title: "Organization",
      shortTitle: "Organization",
      status: stepStatus({
        complete: facts.organizationComplete,
        started: Boolean(facts.organizationName),
      }),
      message: facts.organizationComplete
        ? facts.organizationName ?? "Organization configured"
        : "Company name is required",
      blocking: !facts.organizationComplete,
      href: "/settings/organization",
    },
    {
      key: "taxpayer",
      title: "Taxpayer Profile",
      shortTitle: "Taxpayer",
      status: stepStatus({
        complete: facts.taxpayerComplete,
        warning: facts.taxpayerWarning,
        started: true,
        needsRecheck: recheck && facts.taxpayerComplete,
      }),
      message: facts.taxpayerComplete
        ? "Taxpayer profile reviewed"
        : "Complete and review taxpayer profile",
      blocking: !facts.taxpayerComplete,
      href: "/compliance/taxpayer",
    },
    {
      key: "erp",
      title: "ERP / CAS",
      shortTitle: "ERP/CAS",
      status: stepStatus({
        complete: facts.erpConnected,
        started: facts.erpConfigured,
        needsRecheck: recheck && facts.erpConnected,
      }),
      message: facts.erpConnected
        ? "ERP connection verified"
        : facts.erpConfigured
          ? "ERP configured — connection not verified"
          : "Configure an ERP connection",
      blocking: !facts.erpConnected,
      href: "/settings/integrations/erp",
    },
    {
      key: "cas_docs",
      title: "CAS Documentation",
      shortTitle: "CAS Docs",
      status: stepStatus({
        complete: facts.casReviewed,
        warning: Boolean(facts.casStatus && facts.casStatus !== "MISSING" && !facts.casReviewed),
        started: Boolean(facts.casStatus && facts.casStatus !== "MISSING"),
      }),
      message: facts.casReviewed
        ? "CAS documentation reviewed internally (not BIR-verified)"
        : facts.casStatus && facts.casStatus !== "MISSING"
          ? `CAS documentation ${facts.casStatus.toLowerCase().replaceAll("_", " ")}`
          : "CAS registration evidence missing",
      blocking: !facts.casReviewed,
      href: "/compliance/erp",
    },
    {
      key: "credentials",
      title: "EIS Credentials",
      shortTitle: "Credentials",
      status: stepStatus({
        complete: facts.credentialsConfigured,
        started: facts.credentialsPartial || facts.credentialsConfigured,
        needsRecheck: recheck && facts.credentialsConfigured,
      }),
      message: facts.credentialsConfigured
        ? "EIS credentials configured"
        : "Configure TIN, PTT metadata, and API credentials",
      blocking: !facts.credentialsConfigured,
      href: "/settings/eis-credentials",
    },
    {
      key: "discovery",
      title: "Data Discovery",
      shortTitle: "Discovery",
      status: stepStatus({
        complete: facts.discoveryComplete && !facts.qualityHasErrors,
        warning: facts.discoveryComplete && facts.qualityHasWarnings,
        started: facts.discoveryComplete,
        needsRecheck: recheck,
        blocked: !facts.erpConnected,
      }),
      message: !facts.erpConnected
        ? "Blocked until ERP connection is verified"
        : facts.discoveryComplete
          ? facts.qualityHasErrors
            ? "Discovery found blocking data-quality errors"
            : "Sample data discovered"
          : "Run ERP data discovery",
      blocking: !facts.discoveryComplete || facts.qualityHasErrors,
    },
    {
      key: "mapping",
      title: "Field Mapping",
      shortTitle: "Mapping",
      status: stepStatus({
        complete: facts.mappingComplete,
        started: facts.mappingMissingCount >= 0,
        needsRecheck: recheck && facts.mappingComplete,
        blocked: !facts.discoveryComplete && !facts.mappingComplete,
      }),
      message: facts.mappingComplete
        ? "Required fields mapped"
        : `${facts.mappingMissingCount} required field(s) unmapped`,
      blocking: !facts.mappingComplete,
      href: "/compliance/mapping",
    },
    {
      key: "validation",
      title: "Validation",
      shortTitle: "Validation",
      status: stepStatus({
        complete: facts.validationPassed && facts.validationRun,
        started: facts.validationRun,
        needsRecheck: recheck,
        blocked: !facts.mappingComplete,
      }),
      message: !facts.mappingComplete
        ? "Blocked until mapping is complete"
        : facts.validationPassed && facts.validationRun
          ? "Compliance validation passed"
          : facts.validationRun
            ? "Validation has blocking failures"
            : "Run compliance validation",
      blocking: !facts.validationPassed || !facts.validationRun,
      href: "/compliance/rules",
    },
    {
      key: "testing",
      title: "Test & Reconciliation",
      shortTitle: "Testing",
      status: stepStatus({
        complete: facts.testTransmissionPassed && facts.reconciliationPassed,
        warning:
          facts.testTransmissionPassed !== facts.reconciliationPassed,
        started: facts.testTransmissionPassed || facts.reconciliationPassed,
        needsRecheck: recheck,
        blocked: !facts.validationPassed,
      }),
      message:
        facts.testTransmissionPassed && facts.reconciliationPassed
          ? "Sandbox test and reconciliation passed"
          : !facts.testTransmissionPassed
            ? "Sandbox test transmission not completed"
            : "Reconciliation not completed",
      blocking: !facts.testTransmissionPassed || !facts.reconciliationPassed,
      href: "/compliance/reconciliation",
    },
    {
      key: "production",
      title: "Production Readiness",
      shortTitle: "Production",
      status: stepStatus({
        complete: facts.productionEnabled || (facts.pttRecorded && facts.testTransmissionPassed && facts.reconciliationPassed && facts.validationPassed),
        started: true,
        needsRecheck: recheck,
        blocked: !facts.pttRecorded || !facts.testTransmissionPassed,
      }),
      message: facts.productionEnabled
        ? "Production transmission enabled"
        : facts.pttRecorded
          ? "Ready for production gate review"
          : "PTT / certification information not recorded",
      blocking: !facts.pttRecorded || !facts.testTransmissionPassed || !facts.reconciliationPassed,
      href: "/compliance/readiness",
    },
  ];

  const completedSteps = steps.filter((s) => s.status === "COMPLETE" || s.status === "WARNING").length;
  const totalRequiredSteps = BIR_SETUP_STEPS.length;
  const blockingIssues = steps.filter((s) => s.blocking).map((s) => s.message);
  const warnings = steps
    .filter((s) => s.status === "WARNING" || s.status === "NEEDS_RECHECK")
    .map((s) => s.message);

  const nextRequiredStep =
    steps.find((s) => s.blocking || s.status === "NEEDS_RECHECK" || s.status === "INCOMPLETE" || s.status === "NOT_STARTED")
      ?.key ?? null;

  const wizardStarted = Boolean(facts.wizardStartedAt) || completedSteps > 0;
  const productionAllowed =
    !facts.requiresRevalidation &&
    facts.organizationComplete &&
    facts.taxpayerComplete &&
    facts.erpConnected &&
    facts.casReviewed &&
    facts.credentialsConfigured &&
    facts.discoveryComplete &&
    !facts.qualityHasErrors &&
    facts.mappingComplete &&
    facts.validationPassed &&
    facts.testTransmissionPassed &&
    facts.reconciliationPassed &&
    facts.pttRecorded;

  let status: BirSetupOverallStatus;
  if (facts.requiresRevalidation) {
    status = "SETUP_REQUIRES_REVALIDATION";
  } else if (facts.productionEnabled) {
    status = "PRODUCTION_ENABLED";
  } else if (productionAllowed) {
    status = "PRODUCTION_READY";
  } else if (facts.testTransmissionPassed || facts.reconciliationPassed) {
    status = "TESTING";
  } else if (
    facts.organizationComplete &&
    facts.taxpayerComplete &&
    facts.erpConnected &&
    facts.credentialsConfigured &&
    facts.mappingComplete
  ) {
    status = "READY_FOR_TESTING";
  } else if (wizardStarted || completedSteps > 0) {
    status = "IN_PROGRESS";
  } else {
    status = "NOT_STARTED";
  }

  return {
    status,
    completedSteps,
    totalRequiredSteps,
    nextRequiredStep,
    steps,
    blockingIssues,
    warnings,
    requiresRevalidation: facts.requiresRevalidation,
    revalidationReason: facts.revalidationReason,
    productionAllowed,
    productionEnabled: facts.productionEnabled,
    environment: facts.environment,
    erpLabel: facts.erpLabel,
    erpConnected: facts.erpConnected,
    validationPassed: facts.validationPassed,
    lastTestAt: facts.lastTestAt?.toISOString() ?? null,
    wizardStarted,
    reminderDismissedAt: facts.reminderDismissedAt?.toISOString() ?? null,
    completionAcknowledgedAt: facts.completionAcknowledgedAt?.toISOString() ?? null,
    discoveryComplete: facts.discoveryComplete,
    qualityHasErrors: facts.qualityHasErrors,
  };
}

export function overallStatusLabel(status: BirSetupOverallStatus): string {
  switch (status) {
    case "NOT_STARTED":
      return "SETUP INCOMPLETE";
    case "IN_PROGRESS":
      return "SETUP INCOMPLETE";
    case "READY_FOR_TESTING":
      return "READY FOR TESTING";
    case "TESTING":
      return "TESTING";
    case "SETUP_REQUIRES_REVALIDATION":
      return "SETUP REQUIRES REVALIDATION";
    case "PRODUCTION_READY":
      return "READY FOR PRODUCTION";
    case "PRODUCTION_ENABLED":
      return "PRODUCTION ENABLED";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
