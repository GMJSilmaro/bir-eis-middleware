import {
  applyErpFieldMap,
  DEFAULT_ERP_FIELD_MAP,
} from "@/features/documents/lib/bir-portal-field-map";
import type { IngestRowInput } from "@/features/documents/lib/create-outbound-drafts";

type ErpSamplePayload = Record<string, string>;

/**
 * Deterministic sandbox ERP documents (no live HTTP).
 * Uses SAP B1–style source keys; apply `fieldMap` to portal fields.
 */
function buildSandboxPayloads(connectionId: string): ErpSamplePayload[] {
  const stamp = connectionId.slice(-4).toUpperCase() || "DEMO";
  const today = new Date().toISOString().slice(0, 10);

  return [
    {
      DocType: "sales_invoice",
      DocNum: `ERP-${stamp}-001`,
      DocDate: today,
      DocCurrency: "PHP",
      CardName: "Sandbox Trading Co.",
      LicTradNum: "123-456-789-00000",
      DocTotalNet: "2500.00",
      VatSum: "300.00",
      DocTotal: "2800.00",
      Comments: "Sandbox ERP sync sample 1",
    },
    {
      DocType: "official_receipt",
      DocNum: `ERP-${stamp}-002`,
      DocDate: today,
      DocCurrency: "PHP",
      CardName: "Demo Retail Partners",
      LicTradNum: "987-654-321-00000",
      DocTotalNet: "800.00",
      VatSum: "96.00",
      DocTotal: "896.00",
      Comments: "Sandbox ERP sync sample 2",
    },
    {
      DocType: "service_billing",
      DocNum: `ERP-${stamp}-003`,
      DocDate: today,
      DocCurrency: "PHP",
      CardName: "Acme Services PH",
      LicTradNum: "111-222-333-00000",
      DocTotalNet: "15000.00",
      VatSum: "1800.00",
      DocTotal: "16800.00",
      Comments: "Sandbox ERP sync sample 3",
    },
    {
      DocType: "sales_invoice",
      DocNum: `ERP-${stamp}-004`,
      DocDate: today,
      DocCurrency: "PHP",
      CardName: "Northern Distributors Inc.",
      LicTradNum: "",
      DocTotalNet: "420.50",
      VatSum: "50.46",
      DocTotal: "470.96",
      Comments: "Sandbox ERP sync sample 4",
    },
  ];
}

function asStringRecord(
  value: unknown,
): Record<string, string> | null | undefined {
  if (value == null) return null;
  if (typeof value !== "object" || Array.isArray(value)) return undefined;
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === "string") out[key] = entry;
  }
  return out;
}

/**
 * Pull sandbox ERP invoices and map them to portal draft field rows.
 */
export function sandboxErpPull(params: {
  connectionId: string;
  fieldMap: unknown;
}): IngestRowInput[] {
  const map =
    asStringRecord(params.fieldMap) ??
    (DEFAULT_ERP_FIELD_MAP as Record<string, string>);
  const payloads = buildSandboxPayloads(params.connectionId);

  return payloads.map((payload, index) => ({
    row: index + 1,
    fields: applyErpFieldMap(payload, map),
  }));
}
