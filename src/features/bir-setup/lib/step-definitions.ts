/**
 * BIR EIS Setup wizard step definitions.
 * Steps orchestrate existing Settings + Compliance modules (single source of truth).
 */

export const BIR_SETUP_STEPS = [
  {
    key: "organization",
    number: 1,
    title: "Organization",
    shortTitle: "Organization",
    description: "Company name, tagline, and logo from workspace branding.",
  },
  {
    key: "taxpayer",
    number: 2,
    title: "Taxpayer Profile",
    shortTitle: "Taxpayer",
    description:
      "BIR taxpayer details used to configure validation and EIS draft mapping.",
  },
  {
    key: "erp",
    number: 3,
    title: "ERP / CAS",
    shortTitle: "ERP/CAS",
    description: "Connect and describe your accounting / ERP system.",
  },
  {
    key: "cas_docs",
    number: 4,
    title: "CAS Documentation",
    shortTitle: "CAS Docs",
    description:
      "Record CAS/CBA registration evidence for internal review (not BIR verification).",
  },
  {
    key: "credentials",
    number: 5,
    title: "EIS Credentials",
    shortTitle: "Credentials",
    description: "TIN, PTT metadata, and API credentials from the existing vault.",
  },
  {
    key: "discovery",
    number: 6,
    title: "Data Discovery",
    shortTitle: "Discovery",
    description: "Sample ERP fields and run a data-quality scan (never transmitted).",
  },
  {
    key: "mapping",
    number: 7,
    title: "Field Mapping",
    shortTitle: "Mapping",
    description: "Map ERP fields → canonical model → EIS fields.",
  },
  {
    key: "validation",
    number: 8,
    title: "Validation",
    shortTitle: "Validation",
    description: "Run the shared compliance rule engine against your setup.",
  },
  {
    key: "testing",
    number: 9,
    title: "Test & Reconciliation",
    shortTitle: "Testing",
    description: "Sandbox transmission and reconciliation checks.",
  },
  {
    key: "production",
    number: 10,
    title: "Production Readiness",
    shortTitle: "Production",
    description: "Final EIS integration readiness checklist and production gate.",
  },
] as const;

export type BirSetupStepKey = (typeof BIR_SETUP_STEPS)[number]["key"];

export const BIR_SETUP_STEP_KEYS = BIR_SETUP_STEPS.map((s) => s.key);

export type BirSetupStepStatus =
  | "COMPLETE"
  | "INCOMPLETE"
  | "WARNING"
  | "BLOCKED"
  | "NOT_STARTED"
  | "NEEDS_RECHECK";

export type BirSetupOverallStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "READY_FOR_TESTING"
  | "TESTING"
  | "SETUP_REQUIRES_REVALIDATION"
  | "PRODUCTION_READY"
  | "PRODUCTION_ENABLED";

export function isBirSetupStepKey(value: string): value is BirSetupStepKey {
  return (BIR_SETUP_STEP_KEYS as readonly string[]).includes(value);
}

export function getStepDefinition(key: BirSetupStepKey) {
  return BIR_SETUP_STEPS.find((s) => s.key === key)!;
}

export function getAdjacentStep(
  key: BirSetupStepKey,
  direction: "prev" | "next",
): BirSetupStepKey | null {
  const index = BIR_SETUP_STEPS.findIndex((s) => s.key === key);
  if (index < 0) return null;
  const nextIndex = direction === "next" ? index + 1 : index - 1;
  return BIR_SETUP_STEPS[nextIndex]?.key ?? null;
}
