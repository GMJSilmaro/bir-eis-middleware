import {
  COMPLIANCE_RULE_VERSION,
  type ComplianceContext,
  type ComplianceOutcome,
  type ComplianceRunSummary,
  type ValidationScope,
} from "@/features/compliance/engine/types";
import { getRulesForScope } from "@/features/compliance/rules/registry";

function rankOutcome(o: ComplianceOutcome): number {
  switch (o) {
    case "FAIL":
      return 3;
    case "WARNING":
      return 2;
    case "PASS":
      return 1;
    case "NOT_APPLICABLE":
      return 0;
    default: {
      const _exhaustive: never = o;
      return _exhaustive;
    }
  }
}

export function runCompliance(
  scope: ValidationScope,
  ctx: Omit<ComplianceContext, "scope">,
): ComplianceRunSummary {
  const fullCtx: ComplianceContext = { ...ctx, scope };
  const rules = getRulesForScope(scope);
  const results = rules.map((rule) => rule.validate.call(rule, fullCtx));

  const blockingFailureCount = results.filter(
    (r) => r.outcome === "FAIL" && r.blocking,
  ).length;

  let overallOutcome: ComplianceOutcome = "PASS";
  for (const r of results) {
    if (rankOutcome(r.outcome) > rankOutcome(overallOutcome)) {
      overallOutcome = r.outcome;
    }
  }
  if (blockingFailureCount > 0) {
    overallOutcome = "FAIL";
  }

  return {
    ruleVersion: COMPLIANCE_RULE_VERSION,
    results,
    overallOutcome,
    blockingFailureCount,
    hasBlockingFailure: blockingFailureCount > 0,
  };
}
