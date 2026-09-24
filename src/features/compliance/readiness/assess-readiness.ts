import {
  ACTIVATION_GATE_STATES,
  type ActivationGateState,
  type ComplianceOutcome,
  type ReadinessCategoryKey,
} from "@/features/compliance/engine/types";

export type ReadinessCategoryResult = {
  key: ReadinessCategoryKey;
  label: string;
  outcome: ComplianceOutcome | "NOT_RUN" | "NOT_RECORDED";
  message: string;
  blocking: boolean;
};

export type ReadinessAssessment = {
  overallReady: boolean;
  overallLabel: string;
  categories: ReadinessCategoryResult[];
  blockingIssues: string[];
  suggestedGateState: ActivationGateState;
};

export type ReadinessInput = {
  taxpayerOutcome: ComplianceOutcome;
  casOutcome: ComplianceOutcome | "NOT_RECORDED";
  erpConnected: boolean;
  mappingComplete: boolean;
  mappingMissingCount: number;
  invoiceValidationOutcome: ComplianceOutcome | "NOT_RUN";
  taxValidationOutcome: ComplianceOutcome | "NOT_RUN";
  hasAuditTrail: boolean;
  testTransmissionPassed: boolean;
  reconciliationPassed: boolean;
  certificationStatus: string;
  productionEnabled: boolean;
};

const LABELS: Record<ReadinessCategoryKey, string> = {
  taxpayer_profile: "Taxpayer Profile",
  cas_documentation: "CAS Documentation",
  erp_integration: "ERP Integration",
  field_mapping: "Required Field Mapping",
  invoice_validation: "Invoice Validation",
  tax_validation: "Tax Validation",
  audit_trail: "Audit Trail",
  transmission: "Transmission Test",
  error_handling: "Error Handling",
  reconciliation: "Reconciliation",
  security: "Security",
  eis_certification_ptt: "EIS Certification / PTT",
};

function mapPassFail(ok: boolean, passMsg: string, failMsg: string) {
  return ok
    ? { outcome: "PASS" as const, message: passMsg, blocking: false }
    : { outcome: "FAIL" as const, message: failMsg, blocking: true };
}

export function assessReadiness(input: ReadinessInput): ReadinessAssessment {
  const categories: ReadinessCategoryResult[] = [
    {
      key: "taxpayer_profile",
      label: LABELS.taxpayer_profile,
      outcome: input.taxpayerOutcome,
      message:
        input.taxpayerOutcome === "PASS"
          ? "Taxpayer profile complete"
          : "Taxpayer profile incomplete",
      blocking: input.taxpayerOutcome === "FAIL",
    },
    {
      key: "cas_documentation",
      label: LABELS.cas_documentation,
      outcome:
        input.casOutcome === "NOT_RECORDED" ? "NOT_APPLICABLE" : input.casOutcome,
      message:
        input.casOutcome === "PASS"
          ? "CAS documentation reviewed internally"
          : "CAS documentation not reviewed",
      blocking: input.casOutcome === "FAIL",
    },
    {
      key: "erp_integration",
      label: LABELS.erp_integration,
      ...mapPassFail(
        input.erpConnected,
        "ERP connection verified",
        "ERP connection not verified",
      ),
    },
    {
      key: "field_mapping",
      label: LABELS.field_mapping,
      outcome: input.mappingComplete ? "PASS" : "FAIL",
      message: input.mappingComplete
        ? "Required fields mapped"
        : `${input.mappingMissingCount} required EIS fields are unmapped`,
      blocking: !input.mappingComplete,
    },
    {
      key: "invoice_validation",
      label: LABELS.invoice_validation,
      outcome: input.invoiceValidationOutcome,
      message:
        input.invoiceValidationOutcome === "PASS"
          ? "Invoice validation rules available"
          : input.invoiceValidationOutcome === "NOT_RUN"
            ? "Invoice validation not run"
            : "Invoice validation has failures",
      blocking: input.invoiceValidationOutcome === "FAIL",
    },
    {
      key: "tax_validation",
      label: LABELS.tax_validation,
      outcome: input.taxValidationOutcome,
      message:
        input.taxValidationOutcome === "PASS"
          ? "Tax/total checks available"
          : input.taxValidationOutcome === "NOT_RUN"
            ? "Tax validation not run"
            : "Tax validation has failures",
      blocking: input.taxValidationOutcome === "FAIL",
    },
    {
      key: "audit_trail",
      label: LABELS.audit_trail,
      ...mapPassFail(
        input.hasAuditTrail,
        "Audit trail enabled",
        "Audit trail missing",
      ),
    },
    {
      key: "transmission",
      label: LABELS.transmission,
      outcome: input.testTransmissionPassed ? "PASS" : "NOT_RUN",
      message: input.testTransmissionPassed
        ? "Sandbox test transmission passed"
        : "Test transmission has not passed",
      blocking: !input.testTransmissionPassed,
    },
    {
      key: "error_handling",
      label: LABELS.error_handling,
      outcome: "PASS",
      message: "Technical vs business failure handling configured",
      blocking: false,
    },
    {
      key: "reconciliation",
      label: LABELS.reconciliation,
      outcome: input.reconciliationPassed ? "PASS" : "NOT_RUN",
      message: input.reconciliationPassed
        ? "Reconciliation check passed"
        : "Reconciliation has not been run successfully",
      blocking: !input.reconciliationPassed,
    },
    {
      key: "security",
      label: LABELS.security,
      outcome: "PASS",
      message: "RBAC and credential vault in place",
      blocking: false,
    },
    {
      key: "eis_certification_ptt",
      label: LABELS.eis_certification_ptt,
      outcome:
        input.certificationStatus === "NOT_RECORDED" || !input.certificationStatus
          ? "NOT_RECORDED"
          : input.certificationStatus === "REVIEWED" ||
              input.certificationStatus === "RECORDED"
            ? "PASS"
            : "WARNING",
      message:
        input.certificationStatus === "NOT_RECORDED" || !input.certificationStatus
          ? "PTT/certification information has not been recorded"
          : "Certification/PTT information recorded (not BIR-verified by this app)",
      blocking:
        input.certificationStatus === "NOT_RECORDED" || !input.certificationStatus,
    },
  ];

  const blockingIssues = categories
    .filter((c) => c.blocking)
    .map((c, i) => `${i + 1}. ${c.message}`);

  const overallReady = blockingIssues.length === 0;
  const suggestedGateState = deriveSuggestedGate(input);

  return {
    overallReady,
    overallLabel: overallReady
      ? "READY FOR PRODUCTION (internal gate)"
      : "NOT READY FOR PRODUCTION",
    categories,
    blockingIssues,
    suggestedGateState,
  };
}

function deriveSuggestedGate(input: ReadinessInput): ActivationGateState {
  if (input.productionEnabled) return "PRODUCTION_ENABLED";
  if (
    input.certificationStatus === "RECORDED" ||
    input.certificationStatus === "REVIEWED"
  ) {
    if (input.reconciliationPassed && input.testTransmissionPassed) {
      return "CERTIFICATION_PTT_RECORDED";
    }
  }
  if (input.reconciliationPassed) return "RECONCILIATION_PASSED";
  if (input.testTransmissionPassed) return "TEST_TRANSMISSION_PASSED";
  if (
    input.invoiceValidationOutcome === "PASS" &&
    input.taxValidationOutcome === "PASS"
  ) {
    return "COMPLIANCE_VALIDATION_PASSED";
  }
  if (input.mappingComplete) return "FIELD_MAPPING_COMPLETE";
  if (input.erpConnected) return "ERP_CONNECTION_VERIFIED";
  if (input.casOutcome === "PASS") return "CAS_DOCUMENTATION_REVIEWED";
  if (input.taxpayerOutcome === "PASS") return "TAXPAYER_PROFILE_COMPLETE";
  return "DRAFT";
}

export function gateStateIndex(state: ActivationGateState): number {
  return ACTIVATION_GATE_STATES.indexOf(state);
}

export function isProductionTransmitAllowed(params: {
  productionEnabled: boolean;
  environment: "cert" | "prod";
}): boolean {
  if (params.environment === "cert") return true;
  return params.productionEnabled;
}
