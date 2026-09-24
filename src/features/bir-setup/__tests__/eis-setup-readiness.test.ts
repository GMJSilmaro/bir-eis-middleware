import { describe, expect, it } from "vitest";

import {
  computeEisSetupReadiness,
  overallStatusLabel,
  type EisSetupFacts,
} from "@/features/bir-setup/lib/compute-eis-setup-readiness";
import {
  discoverFieldsFromSamples,
  runDataQualityScan,
} from "@/features/bir-setup/lib/data-discovery";

function baseFacts(overrides: Partial<EisSetupFacts> = {}): EisSetupFacts {
  return {
    organizationComplete: false,
    organizationName: null,
    taxpayerComplete: false,
    taxpayerWarning: false,
    erpConfigured: false,
    erpConnected: false,
    erpLabel: null,
    casStatus: null,
    casReviewed: false,
    credentialsConfigured: false,
    credentialsPartial: false,
    environment: null,
    discoveryComplete: false,
    qualityHasErrors: false,
    qualityHasWarnings: false,
    mappingComplete: false,
    mappingMissingCount: 3,
    validationPassed: false,
    validationRun: false,
    testTransmissionPassed: false,
    reconciliationPassed: false,
    pttRecorded: false,
    productionEnabled: false,
    requiresRevalidation: false,
    revalidationReason: null,
    wizardStartedAt: null,
    reminderDismissedAt: null,
    completionAcknowledgedAt: null,
    lastTestAt: null,
    ...overrides,
  };
}

describe("computeEisSetupReadiness", () => {
  it("starts as NOT_STARTED with organization blocking", () => {
    const result = computeEisSetupReadiness(baseFacts());
    expect(result.status).toBe("NOT_STARTED");
    expect(overallStatusLabel(result.status)).toBe("SETUP INCOMPLETE");
    expect(result.nextRequiredStep).toBe("organization");
    expect(result.productionAllowed).toBe(false);
  });

  it("marks PRODUCTION_READY when all gates pass", () => {
    const result = computeEisSetupReadiness(
      baseFacts({
        organizationComplete: true,
        organizationName: "Pixelcare",
        taxpayerComplete: true,
        erpConfigured: true,
        erpConnected: true,
        erpLabel: "SAP B1",
        casStatus: "REVIEWED",
        casReviewed: true,
        credentialsConfigured: true,
        environment: "cert",
        discoveryComplete: true,
        mappingComplete: true,
        mappingMissingCount: 0,
        validationPassed: true,
        validationRun: true,
        testTransmissionPassed: true,
        reconciliationPassed: true,
        pttRecorded: true,
        wizardStartedAt: new Date(),
      }),
    );
    expect(result.status).toBe("PRODUCTION_READY");
    expect(result.productionAllowed).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
    expect(overallStatusLabel(result.status)).toBe("READY FOR PRODUCTION");
  });

  it("requires revalidation after upstream change", () => {
    const result = computeEisSetupReadiness(
      baseFacts({
        organizationComplete: true,
        organizationName: "Pixelcare",
        taxpayerComplete: true,
        erpConnected: true,
        casReviewed: true,
        credentialsConfigured: true,
        discoveryComplete: true,
        mappingComplete: true,
        mappingMissingCount: 0,
        validationPassed: true,
        validationRun: true,
        testTransmissionPassed: true,
        reconciliationPassed: true,
        pttRecorded: true,
        requiresRevalidation: true,
        revalidationReason: "ERP connection changed",
        wizardStartedAt: new Date(),
      }),
    );
    expect(result.status).toBe("SETUP_REQUIRES_REVALIDATION");
    expect(result.productionAllowed).toBe(false);
    expect(result.steps.find((s) => s.key === "discovery")?.status).toBe(
      "NEEDS_RECHECK",
    );
  });
});

describe("data discovery", () => {
  it("finds SAP-style fields and flags quality issues", () => {
    const samples = [
      {
        DocNum: "SI-1",
        DocDate: "2026-09-01",
        DocType: "I",
        CardName: "Buyer Co",
        LicTradNum: "123-456-789-00000",
        DocTotalNet: "1000.00",
        VatSum: "120.00",
        DocTotal: "1120.00",
        DocCurrency: "PHP",
      },
      {
        DocNum: "SI-2",
        DocDate: "2026-09-02",
        CardName: "No Tin Buyer",
        LicTradNum: "",
        DocTotalNet: "100.00",
        VatSum: "12.00",
        DocTotal: "200.00",
      },
    ];

    const discovery = discoverFieldsFromSamples({
      samples,
      source: "json_upload",
    });
    expect(discovery.fields.find((f) => f.key === "invoiceNumber")?.status).toBe(
      "FOUND",
    );
    expect(discovery.fields.find((f) => f.key === "buyerTin")?.status).toBe(
      "FOUND",
    );

    const quality = runDataQualityScan(samples);
    expect(quality.missingTin).toBeGreaterThan(0);
    expect(quality.taxMismatch).toBeGreaterThan(0);
    expect(quality.errors).toBeGreaterThan(0);
  });
});
