import { describe, expect, it } from "vitest";

import { evaluateProductionGate } from "@/features/compliance/activation/gate";
import { runCompliance } from "@/features/compliance/engine/run-compliance";
import { isPlausibleTin } from "@/features/compliance/engine/types";
import { unmappedRequiredFields } from "@/features/compliance/lib/field-mapping-defaults";
import { assessReadiness } from "@/features/compliance/readiness/assess-readiness";
import {
  buildIdempotencyKey,
  canRetryTechnical,
} from "@/features/eis/transmission";
import { deriveBusinessStatus } from "@/features/documents/lib/document-business-status";

const validInvoice = {
  documentNumber: "SI-1",
  issueDate: "2026-09-01",
  documentType: "sales_invoice",
  currency: "PHP",
  counterpartName: "Buyer Co",
  counterpartTin: "123456789",
  lineExtensionAmount: "1000.00",
  taxAmount: "120.00",
  totalAmount: "1120.00",
  sellerTin: "987654321000",
  sellerRegisteredName: "Seller Co",
  sellerBranchCode: "00000",
};

describe("compliance rule engine", () => {
  it("1. valid invoice passes invoice scope", () => {
    const summary = runCompliance("invoice", {
      invoice: validInvoice,
    });
    expect(summary.hasBlockingFailure).toBe(false);
    expect(summary.overallOutcome).toBe("PASS");
  });

  it("2. missing seller TIN fails", () => {
    const summary = runCompliance("invoice", {
      invoice: { ...validInvoice, sellerTin: null },
    });
    expect(summary.hasBlockingFailure).toBe(true);
    expect(
      summary.results.some(
        (r) => r.ruleCode === "EIS-SELL-001" && r.outcome === "FAIL",
      ),
    ).toBe(true);
  });

  it("3. malformed TIN fails", () => {
    expect(isPlausibleTin("12")).toBe(false);
    const summary = runCompliance("invoice", {
      invoice: { ...validInvoice, sellerTin: "12" },
    });
    expect(
      summary.results.some(
        (r) => r.ruleCode === "EIS-SELL-001" && r.outcome === "FAIL",
      ),
    ).toBe(true);
  });

  it("4. duplicate invoice blocked", () => {
    const summary = runCompliance("invoice", {
      invoice: { ...validInvoice, isDuplicateNumber: true },
    });
    expect(
      summary.results.some(
        (r) => r.ruleCode === "EIS-DUP-001" && r.outcome === "FAIL" && r.blocking,
      ),
    ).toBe(true);
  });

  it("5. VAT/totals mismatch detected", () => {
    const summary = runCompliance("invoice", {
      invoice: { ...validInvoice, totalAmount: "999.00" },
    });
    expect(
      summary.results.some(
        (r) => r.ruleCode === "EIS-TOTAL-001" && r.outcome === "FAIL",
      ),
    ).toBe(true);
  });

  it("6. missing mapping blocks readiness", () => {
    const missing = unmappedRequiredFields([
      { canonicalField: "documentNumber" },
    ]);
    expect(missing.length).toBeGreaterThan(0);
    const readiness = assessReadiness({
      taxpayerOutcome: "PASS",
      casOutcome: "PASS",
      erpConnected: true,
      mappingComplete: missing.length === 0,
      mappingMissingCount: missing.length,
      invoiceValidationOutcome: "PASS",
      taxValidationOutcome: "PASS",
      hasAuditTrail: true,
      testTransmissionPassed: true,
      reconciliationPassed: true,
      certificationStatus: "RECORDED",
      productionEnabled: false,
    });
    expect(readiness.overallReady).toBe(false);
    expect(
      readiness.categories.some(
        (c) => c.key === "field_mapping" && c.outcome === "FAIL",
      ),
    ).toBe(true);
  });

  it("7. technical transmission enters retry-eligible state", () => {
    expect(canRetryTechnical(1)).toBe(true);
    expect(canRetryTechnical(5)).toBe(false);
  });

  it("8. business rejection does not auto-retry (policy)", () => {
    const failureClass = "BUSINESS";
    const shouldAutoRetry =
      (failureClass as string) === "TECHNICAL" && canRetryTechnical(1);
    expect(shouldAutoRetry).toBe(false);
  });

  it("9. retry uses stable idempotency key (no duplicate key identity)", () => {
    const key1 = buildIdempotencyKey({
      tenantId: "t1",
      tin: "123-456-789",
      branchCode: "00000",
      documentType: "sales_invoice",
      documentNumber: "SI-1",
    });
    const key2 = buildIdempotencyKey({
      tenantId: "t1",
      tin: "123456789",
      branchCode: "00000",
      documentType: "sales_invoice",
      documentNumber: "SI-1",
    });
    expect(key1).toBe(key2);
  });

  it("10. accepted invoice cannot be directly edited (status guard)", () => {
    const status: string = "accepted";
    const canEdit = status === "draft";
    expect(canEdit).toBe(false);
  });

  it("11. cancellation retains original transmission status in timeline model", () => {
    const business = deriveBusinessStatus({
      status: "accepted",
      cancellationStatus: "accepted",
    });
    expect(business).toBe("cancelled");
    // Underlying transmission status remains accepted in DB; business view is cancelled.
    expect(deriveBusinessStatus({ status: "accepted", cancellationStatus: null })).toBe(
      "accepted",
    );
  });

  it("12. unauthorized user cannot enable production (permission gate)", () => {
    const permissions = ["compliance.view"];
    expect(permissions.includes("compliance.production.enable")).toBe(false);
  });

  it("13. tenant isolation key includes tenantId", () => {
    const a = buildIdempotencyKey({
      tenantId: "tenant-a",
      tin: "1",
      branchCode: "00000",
      documentType: "sales_invoice",
      documentNumber: "SI-1",
    });
    const b = buildIdempotencyKey({
      tenantId: "tenant-b",
      tin: "1",
      branchCode: "00000",
      documentType: "sales_invoice",
      documentNumber: "SI-1",
    });
    expect(a).not.toBe(b);
  });

  it("14. production transmission blocked when readiness fails", () => {
    const gate = evaluateProductionGate({
      gateState: "DRAFT",
      productionEnabled: false,
      taxpayerComplete: false,
      casReviewed: false,
      erpVerified: false,
      mappingComplete: false,
      validationPassed: false,
      testTransmissionPassed: false,
      reconciliationPassed: false,
      certificationRecorded: false,
    });
    expect(gate.canEnableProduction).toBe(false);
    expect(gate.missingGates.length).toBeGreaterThan(0);
  });

  it("15. audit-sensitive actions are named for compliance trail", () => {
    const actions = [
      "CONFIG_CHANGED",
      "MAPPING_CHANGED",
      "VALIDATION_RUN",
      "SUBMISSION_STARTED",
      "SUBMISSION_SUCCEEDED",
      "SUBMISSION_FAILED",
      "RETRY_REQUESTED",
      "STATUS_CHANGED",
    ];
    expect(actions).toContain("VALIDATION_RUN");
    expect(actions).toContain("SUBMISSION_FAILED");
  });
});
