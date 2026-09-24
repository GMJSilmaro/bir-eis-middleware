import {
  isPlausibleTin,
  moneyNumber,
  NEEDS_REGULATORY_CONFIRMATION,
  resultFail,
  resultNa,
  resultPass,
  resultWarning,
  type ComplianceCategory,
  type ComplianceContext,
  type ComplianceRule,
  type ComplianceRuleResult,
  type ComplianceSeverity,
  type ValidationScope,
} from "@/features/compliance/engine/types";

const ONBOARDING_SCOPES: ValidationScope[] = ["onboarding", "readiness"];
const INVOICE_SCOPES: ValidationScope[] = [
  "invoice",
  "batch",
  "pre_transmit",
];

type RuleDef = {
  code: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  description: string;
  regulatoryReference: string;
  blocking: boolean;
  scopes: ValidationScope[];
  check: (rule: ComplianceRule, ctx: ComplianceContext) => ComplianceRuleResult;
};

function defineRule(def: RuleDef): ComplianceRule {
  const rule: ComplianceRule = {
    code: def.code,
    category: def.category,
    severity: def.severity,
    description: def.description,
    regulatoryReference: def.regulatoryReference,
    blocking: def.blocking,
    scopes: def.scopes,
    validate: (ctx) => def.check(rule, ctx),
  };
  return rule;
}

export const COMPLIANCE_RULES: ComplianceRule[] = [
  defineRule({
    code: "TAXPAYER-001",
    category: "TAXPAYER",
    severity: "critical",
    description: "Taxpayer registered name and TIN must be provided",
    regulatoryReference: NEEDS_REGULATORY_CONFIRMATION,
    blocking: true,
    scopes: [...ONBOARDING_SCOPES, "pre_transmit"],
    check(rule, ctx) {
      const tp = ctx.taxpayer;
      if (!tp) {
        return resultFail(rule, "Taxpayer profile is missing", {
          expected: "registeredName + TIN",
          actual: "missing",
          source: "taxpayer_profile",
        });
      }
      if (!tp.registeredName?.trim() || !tp.tin?.trim()) {
        return resultFail(rule, "Registered name and TIN are required", {
          expected: "registeredName + TIN",
          actual: `name=${tp.registeredName ?? ""}; tin=${tp.tin ?? ""}`,
          source: "taxpayer_profile",
        });
      }
      if (!isPlausibleTin(tp.tin)) {
        return resultFail(rule, "Taxpayer TIN format is invalid", {
          expected: "9–14 digits",
          actual: tp.tin,
          source: "taxpayer_profile",
        });
      }
      return resultPass(rule, "Taxpayer name and TIN provided");
    },
  }),
  defineRule({
    code: "TAXPAYER-002",
    category: "TAXPAYER",
    severity: "error",
    description: "Branch code should be recorded for HO/branch clarity",
    regulatoryReference: NEEDS_REGULATORY_CONFIRMATION,
    blocking: true,
    scopes: [...ONBOARDING_SCOPES, "pre_transmit"],
    check(rule, ctx) {
      const tp = ctx.taxpayer;
      if (!tp?.branchCode?.trim()) {
        return resultFail(rule, "Branch code is not provided", {
          expected: "branch code (e.g. 00000 for head office)",
          actual: tp?.branchCode ?? "missing",
          source: "taxpayer_profile",
        });
      }
      return resultPass(rule, "Branch code provided");
    },
  }),
  defineRule({
    code: "CAS-REG-001",
    category: "CAS",
    severity: "error",
    description: "CAS registration documentary evidence must be reviewed",
    regulatoryReference: NEEDS_REGULATORY_CONFIRMATION,
    blocking: true,
    scopes: [...ONBOARDING_SCOPES],
    check(rule, ctx) {
      const cas = ctx.cas;
      if (!cas || cas.status === "MISSING" || !cas.status) {
        return resultFail(rule, "CAS registration evidence is missing", {
          expected: "REVIEWED (documentary)",
          actual: cas?.status ?? "MISSING",
          source: "cas_registration",
        });
      }
      if (cas.status === "REJECTED") {
        return resultFail(rule, "CAS registration evidence was rejected", {
          expected: "REVIEWED",
          actual: cas.status,
          source: "cas_registration",
        });
      }
      if (cas.status !== "REVIEWED") {
        return resultWarning(
          rule,
          "CAS documentation provided but not yet reviewed internally",
          {
            expected: "REVIEWED",
            actual: cas.status,
            source: "cas_registration",
          },
        );
      }
      return resultPass(
        rule,
        "CAS documentation reviewed internally (not BIR-verified by this app)",
      );
    },
  }),
  defineRule({
    code: "EIS-MAP-001",
    category: "MAPPING",
    severity: "critical",
    description: "Required canonical fields must be mapped",
    regulatoryReference: NEEDS_REGULATORY_CONFIRMATION,
    blocking: true,
    scopes: [...ONBOARDING_SCOPES, "pre_transmit"],
    check(rule, ctx) {
      const required = ctx.requiredCanonicalFields ?? [
        "documentNumber",
        "issueDate",
        "documentType",
        "counterpartName",
        "lineExtensionAmount",
        "taxAmount",
        "totalAmount",
      ];
      const mappings = ctx.mappings ?? [];
      // Manual-only tenants without any mapping rows: N/A for pre-transmit;
      // onboarding/readiness still expect mappings when ERP is in use.
      if (mappings.length === 0 && ctx.scope === "pre_transmit") {
        return resultNa(
          rule,
          "No field mappings configured — skipped for pre-transmit",
        );
      }
      const mapped = new Set(mappings.map((m) => m.canonicalField));
      const missing = required.filter((f) => !mapped.has(f));
      if (missing.length > 0) {
        return resultFail(rule, `${missing.length} required field(s) unmapped`, {
          expected: required.join(", "),
          actual: `missing: ${missing.join(", ")}`,
          source: "field_mapping",
        });
      }
      return resultPass(rule, "Required canonical fields are mapped");
    },
  }),
  defineRule({
    code: "EIS-INV-001",
    category: "INVOICE",
    severity: "critical",
    description: "Invoice number, date, type, and currency are required",
    regulatoryReference: "RR 11-2025",
    blocking: true,
    scopes: [...INVOICE_SCOPES],
    check(rule, ctx) {
      const inv = ctx.invoice;
      if (!inv) return resultNa(rule, "No invoice in context");
      const missing: string[] = [];
      if (!inv.documentNumber?.trim()) missing.push("documentNumber");
      if (!inv.issueDate) missing.push("issueDate");
      if (!inv.documentType?.trim()) missing.push("documentType");
      if (!inv.currency?.trim()) missing.push("currency");
      if (missing.length) {
        return resultFail(rule, "Required invoice fields missing", {
          expected: "documentNumber, issueDate, documentType, currency",
          actual: `missing: ${missing.join(", ")}`,
          source: "invoice",
        });
      }
      return resultPass(rule, "Invoice identity fields present");
    },
  }),
  defineRule({
    code: "EIS-DUP-001",
    category: "INVOICE",
    severity: "critical",
    description: "Duplicate invoice numbers are blocked",
    regulatoryReference: NEEDS_REGULATORY_CONFIRMATION,
    blocking: true,
    scopes: [...INVOICE_SCOPES],
    check(rule, ctx) {
      const inv = ctx.invoice;
      if (!inv) return resultNa(rule, "No invoice in context");
      if (inv.isDuplicateNumber) {
        return resultFail(rule, "Duplicate invoice number for tenant", {
          expected: "unique documentNumber",
          actual: inv.documentNumber ?? "",
          source: "invoice",
        });
      }
      return resultPass(rule, "Invoice number is unique");
    },
  }),
  defineRule({
    code: "EIS-SELL-001",
    category: "SELLER",
    severity: "critical",
    description: "Seller TIN and registered name are required",
    regulatoryReference: "RR 11-2025",
    blocking: true,
    scopes: [...INVOICE_SCOPES],
    check(rule, ctx) {
      const inv = ctx.invoice;
      if (!inv) return resultNa(rule, "No invoice in context");
      if (!inv.sellerTin?.trim()) {
        return resultFail(rule, "Seller TIN is missing", {
          expected: "seller TIN",
          actual: "missing",
          source: "seller",
        });
      }
      if (!isPlausibleTin(inv.sellerTin)) {
        return resultFail(rule, "Seller TIN format is invalid", {
          expected: "9–14 digits",
          actual: inv.sellerTin,
          source: "seller",
        });
      }
      if (!inv.sellerRegisteredName?.trim()) {
        return resultFail(rule, "Seller registered name is missing", {
          expected: "registered name",
          actual: "missing",
          source: "seller",
        });
      }
      return resultPass(rule, "Seller identity present");
    },
  }),
  defineRule({
    code: "EIS-BUY-001",
    category: "BUYER",
    severity: "error",
    description: "Buyer name is required; TIN checked when provided",
    regulatoryReference: NEEDS_REGULATORY_CONFIRMATION,
    blocking: true,
    scopes: [...INVOICE_SCOPES],
    check(rule, ctx) {
      const inv = ctx.invoice;
      if (!inv) return resultNa(rule, "No invoice in context");
      if (!inv.counterpartName?.trim()) {
        return resultFail(rule, "Buyer name is missing", {
          expected: "buyer name",
          actual: "missing",
          source: "buyer",
        });
      }
      if (inv.counterpartTin?.trim() && !isPlausibleTin(inv.counterpartTin)) {
        return resultFail(rule, "Buyer TIN format is invalid", {
          expected: "9–14 digits when provided",
          actual: inv.counterpartTin,
          source: "buyer",
        });
      }
      return resultPass(rule, "Buyer details acceptable");
    },
  }),
  defineRule({
    code: "EIS-TAX-001",
    category: "TAX",
    severity: "error",
    description: "Tax amount must be present and non-negative",
    regulatoryReference: NEEDS_REGULATORY_CONFIRMATION,
    blocking: true,
    scopes: [...INVOICE_SCOPES],
    check(rule, ctx) {
      const inv = ctx.invoice;
      if (!inv) return resultNa(rule, "No invoice in context");
      const tax = moneyNumber(inv.taxAmount);
      if (tax === null) {
        return resultFail(rule, "Tax amount is missing or invalid", {
          expected: "numeric tax amount",
          actual: String(inv.taxAmount ?? ""),
          source: "tax",
        });
      }
      if (tax < 0) {
        return resultFail(rule, "Tax amount cannot be negative", {
          expected: ">= 0",
          actual: String(tax),
          source: "tax",
        });
      }
      return resultPass(rule, "Tax amount present");
    },
  }),
  defineRule({
    code: "EIS-TOTAL-001",
    category: "TOTAL",
    severity: "critical",
    description: "Line + tax must equal total within rounding tolerance",
    regulatoryReference: NEEDS_REGULATORY_CONFIRMATION,
    blocking: true,
    scopes: [...INVOICE_SCOPES],
    check(rule, ctx) {
      const inv = ctx.invoice;
      if (!inv) return resultNa(rule, "No invoice in context");
      const line = moneyNumber(inv.lineExtensionAmount);
      const tax = moneyNumber(inv.taxAmount);
      const total = moneyNumber(inv.totalAmount);
      if (line === null || tax === null || total === null) {
        return resultFail(rule, "Amount fields incomplete for total check", {
          expected: "line + tax = total",
          actual: `line=${line}; tax=${tax}; total=${total}`,
          source: "totals",
        });
      }
      const expected = Math.round((line + tax) * 100) / 100;
      const delta = Math.abs(expected - total);
      if (delta > 0.01) {
        return resultFail(rule, "VAT/totals mismatch detected", {
          expected: String(expected),
          actual: String(total),
          source: "totals",
        });
      }
      return resultPass(rule, "Totals reconcile within tolerance");
    },
  }),
  defineRule({
    code: "EIS-AUD-001",
    category: "AUDIT",
    severity: "warning",
    description: "Audit trail capability should be available",
    regulatoryReference: NEEDS_REGULATORY_CONFIRMATION,
    blocking: false,
    scopes: [...ONBOARDING_SCOPES],
    check(rule, ctx) {
      if (ctx.hasAuditTrail === false) {
        return resultWarning(rule, "Audit trail appears unavailable", {
          source: "audit",
        });
      }
      return resultPass(rule, "Audit trail available");
    },
  }),
];

export function getRulesForScope(scope: ValidationScope): ComplianceRule[] {
  return COMPLIANCE_RULES.filter((r) =>
    (r.scopes as readonly string[]).includes(scope),
  );
}
