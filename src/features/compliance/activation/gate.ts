import {
  ACTIVATION_GATE_STATES,
  type ActivationGateState,
} from "@/features/compliance/engine/types";
import { gateStateIndex } from "@/features/compliance/readiness/assess-readiness";

export type GateEvaluation = {
  current: ActivationGateState;
  canEnableProduction: boolean;
  missingGates: ActivationGateState[];
  message: string;
};

const REQUIRED_BEFORE_PRODUCTION: ActivationGateState[] = [
  "TAXPAYER_PROFILE_COMPLETE",
  "CAS_DOCUMENTATION_REVIEWED",
  "ERP_CONNECTION_VERIFIED",
  "FIELD_MAPPING_COMPLETE",
  "COMPLIANCE_VALIDATION_PASSED",
  "TEST_TRANSMISSION_PASSED",
  "RECONCILIATION_PASSED",
  "CERTIFICATION_PTT_RECORDED",
];

export function evaluateProductionGate(params: {
  gateState: string;
  productionEnabled: boolean;
  taxpayerComplete: boolean;
  casReviewed: boolean;
  erpVerified: boolean;
  mappingComplete: boolean;
  validationPassed: boolean;
  testTransmissionPassed: boolean;
  reconciliationPassed: boolean;
  certificationRecorded: boolean;
}): GateEvaluation {
  const current = (
    ACTIVATION_GATE_STATES.includes(params.gateState as ActivationGateState)
      ? params.gateState
      : "DRAFT"
  ) as ActivationGateState;

  const checks: { state: ActivationGateState; ok: boolean }[] = [
    { state: "TAXPAYER_PROFILE_COMPLETE", ok: params.taxpayerComplete },
    { state: "CAS_DOCUMENTATION_REVIEWED", ok: params.casReviewed },
    { state: "ERP_CONNECTION_VERIFIED", ok: params.erpVerified },
    { state: "FIELD_MAPPING_COMPLETE", ok: params.mappingComplete },
    { state: "COMPLIANCE_VALIDATION_PASSED", ok: params.validationPassed },
    { state: "TEST_TRANSMISSION_PASSED", ok: params.testTransmissionPassed },
    { state: "RECONCILIATION_PASSED", ok: params.reconciliationPassed },
    { state: "CERTIFICATION_PTT_RECORDED", ok: params.certificationRecorded },
  ];

  const missingGates = checks.filter((c) => !c.ok).map((c) => c.state);
  const canEnableProduction =
    params.productionEnabled || missingGates.length === 0;

  return {
    current,
    canEnableProduction,
    missingGates,
    message:
      missingGates.length === 0
        ? "All internal readiness gates passed"
        : `Missing gates: ${missingGates.join(", ")}`,
  };
}

/** Advance gate state to the furthest justified by facts (never skips recorded cert via override). */
export function computeGateStateFromFacts(params: {
  taxpayerComplete: boolean;
  casReviewed: boolean;
  erpVerified: boolean;
  mappingComplete: boolean;
  validationPassed: boolean;
  testTransmissionPassed: boolean;
  reconciliationPassed: boolean;
  certificationRecorded: boolean;
  productionEnabled: boolean;
}): ActivationGateState {
  if (params.productionEnabled) return "PRODUCTION_ENABLED";
  if (params.certificationRecorded && params.reconciliationPassed) {
    return "CERTIFICATION_PTT_RECORDED";
  }
  if (params.reconciliationPassed) return "RECONCILIATION_PASSED";
  if (params.testTransmissionPassed) return "TEST_TRANSMISSION_PASSED";
  if (params.validationPassed) return "COMPLIANCE_VALIDATION_PASSED";
  if (params.mappingComplete) return "FIELD_MAPPING_COMPLETE";
  if (params.erpVerified) return "ERP_CONNECTION_VERIFIED";
  if (params.casReviewed) return "CAS_DOCUMENTATION_REVIEWED";
  if (params.taxpayerComplete) return "TAXPAYER_PROFILE_COMPLETE";
  return "DRAFT";
}

export function assertGateAtLeast(
  current: ActivationGateState,
  required: ActivationGateState,
): boolean {
  return gateStateIndex(current) >= gateStateIndex(required);
}

export { REQUIRED_BEFORE_PRODUCTION };
