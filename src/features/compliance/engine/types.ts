/** Compliance rule engine shared types. */

export const COMPLIANCE_RULE_VERSION = "1.0.0";

export const COMPLIANCE_CATEGORIES = [
  "TAXPAYER",
  "CAS",
  "INVOICE",
  "SELLER",
  "BUYER",
  "TAX",
  "TOTAL",
  "MAPPING",
  "INTEGRATION",
  "AUDIT",
  "TRANSMISSION",
  "SECURITY",
] as const;

export type ComplianceCategory = (typeof COMPLIANCE_CATEGORIES)[number];

export const COMPLIANCE_OUTCOMES = [
  "PASS",
  "FAIL",
  "WARNING",
  "NOT_APPLICABLE",
] as const;

export type ComplianceOutcome = (typeof COMPLIANCE_OUTCOMES)[number];

export const COMPLIANCE_SEVERITIES = [
  "info",
  "warning",
  "error",
  "critical",
] as const;

export type ComplianceSeverity = (typeof COMPLIANCE_SEVERITIES)[number];

export const VALIDATION_SCOPES = [
  "onboarding",
  "invoice",
  "batch",
  "pre_transmit",
  "readiness",
] as const;

export type ValidationScope = (typeof VALIDATION_SCOPES)[number];

export const PROFILE_STATUSES = [
  "NOT_PROVIDED",
  "PENDING_REVIEW",
  "DOCUMENTATION_PROVIDED",
  "REVIEWED",
] as const;

export type ProfileStatus = (typeof PROFILE_STATUSES)[number];

export const CAS_STATUSES = [
  "MISSING",
  "PROVIDED",
  "UNDER_REVIEW",
  "REVIEWED",
  "REJECTED",
] as const;

export type CasStatus = (typeof CAS_STATUSES)[number];

export const CERTIFICATION_STATUSES = [
  "NOT_RECORDED",
  "RECORDED",
  "UNDER_REVIEW",
  "REVIEWED",
] as const;

export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number];

export const ACTIVATION_GATE_STATES = [
  "DRAFT",
  "TAXPAYER_PROFILE_COMPLETE",
  "CAS_DOCUMENTATION_REVIEWED",
  "ERP_CONNECTION_VERIFIED",
  "FIELD_MAPPING_COMPLETE",
  "COMPLIANCE_VALIDATION_PASSED",
  "TEST_TRANSMISSION_PASSED",
  "RECONCILIATION_PASSED",
  "CERTIFICATION_PTT_RECORDED",
  "PRODUCTION_ENABLED",
] as const;

export type ActivationGateState = (typeof ACTIVATION_GATE_STATES)[number];

export const READINESS_CATEGORY_KEYS = [
  "taxpayer_profile",
  "cas_documentation",
  "erp_integration",
  "field_mapping",
  "invoice_validation",
  "tax_validation",
  "audit_trail",
  "transmission",
  "error_handling",
  "reconciliation",
  "security",
  "eis_certification_ptt",
] as const;

export type ReadinessCategoryKey = (typeof READINESS_CATEGORY_KEYS)[number];

/** Marker when a rule is not confirmed against official BIR text. */
export const NEEDS_REGULATORY_CONFIRMATION = "NEEDS_REGULATORY_CONFIRMATION";

export type ComplianceRuleResult = {
  ruleCode: string;
  category: ComplianceCategory;
  outcome: ComplianceOutcome;
  message: string;
  expected?: string;
  actual?: string;
  severity: ComplianceSeverity;
  blocking: boolean;
  source?: string;
  regulatoryReference?: string;
};

export type TaxpayerProfileContext = {
  registeredName?: string | null;
  tin?: string | null;
  branchCode?: string | null;
  officeType?: string | null;
  rdoCode?: string | null;
  classification?: string | null;
  vatMode?: string | null;
  businessAddress?: string | null;
  profileStatus?: string | null;
};

export type CasRegistrationContext = {
  status?: string | null;
  ackCertificateRef?: string | null;
  registeredSystem?: string | null;
};

export type FieldMappingContext = {
  erpField: string;
  canonicalField: string;
  eisField?: string | null;
  required: boolean;
};

export type InvoiceContext = {
  documentNumber?: string | null;
  issueDate?: string | Date | null;
  documentType?: string | null;
  currency?: string | null;
  sourceErpId?: string | null;
  counterpartName?: string | null;
  counterpartTin?: string | null;
  lineExtensionAmount?: string | number | null;
  taxAmount?: string | number | null;
  totalAmount?: string | number | null;
  sellerTin?: string | null;
  sellerRegisteredName?: string | null;
  sellerBranchCode?: string | null;
  vatMode?: string | null;
  /** True when another active doc shares tenant+direction+number. */
  isDuplicateNumber?: boolean;
};

export type ComplianceContext = {
  scope: ValidationScope;
  taxpayer?: TaxpayerProfileContext | null;
  cas?: CasRegistrationContext | null;
  mappings?: FieldMappingContext[];
  /** Canonical / EIS fields that must be mapped for production. */
  requiredCanonicalFields?: string[];
  invoice?: InvoiceContext | null;
  hasAuditTrail?: boolean;
  productionEnabled?: boolean;
};

export type ComplianceRule = {
  code: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  description: string;
  regulatoryReference: string;
  blocking: boolean;
  /** Which scopes this rule applies to. */
  scopes: ValidationScope[];
  validate: (ctx: ComplianceContext) => ComplianceRuleResult;
};

export type ComplianceRunSummary = {
  ruleVersion: string;
  results: ComplianceRuleResult[];
  overallOutcome: ComplianceOutcome;
  blockingFailureCount: number;
  hasBlockingFailure: boolean;
};

export function moneyNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

/** Philippine TIN: 9 digits (optionally with branch). Digits only length 9–14. */
export function isPlausibleTin(tin: string | null | undefined): boolean {
  if (!tin) return false;
  const digits = tin.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 14;
}

export function resultPass(
  rule: ComplianceRule,
  message: string,
  extras?: Partial<ComplianceRuleResult>,
): ComplianceRuleResult {
  return {
    ruleCode: rule.code,
    category: rule.category,
    outcome: "PASS",
    message,
    severity: rule.severity,
    blocking: false,
    regulatoryReference: rule.regulatoryReference,
    ...extras,
  };
}

export function resultFail(
  rule: ComplianceRule,
  message: string,
  extras?: Partial<ComplianceRuleResult>,
): ComplianceRuleResult {
  return {
    ruleCode: rule.code,
    category: rule.category,
    outcome: "FAIL",
    message,
    severity: rule.severity,
    blocking: rule.blocking,
    regulatoryReference: rule.regulatoryReference,
    ...extras,
  };
}

export function resultWarning(
  rule: ComplianceRule,
  message: string,
  extras?: Partial<ComplianceRuleResult>,
): ComplianceRuleResult {
  return {
    ruleCode: rule.code,
    category: rule.category,
    outcome: "WARNING",
    message,
    severity: "warning",
    blocking: false,
    regulatoryReference: rule.regulatoryReference,
    ...extras,
  };
}

export function resultNa(
  rule: ComplianceRule,
  message: string,
): ComplianceRuleResult {
  return {
    ruleCode: rule.code,
    category: rule.category,
    outcome: "NOT_APPLICABLE",
    message,
    severity: "info",
    blocking: false,
    regulatoryReference: rule.regulatoryReference,
  };
}
