/**
 * Canonical BIR / portal outbound field map for Excel CSV and ERP ingest.
 * Headers align with `createOutboundDocumentSchema`.
 */

export const OUTBOUND_CSV_HEADERS = [
  "documentType",
  "documentNumber",
  "issueDate",
  "currency",
  "counterpartName",
  "counterpartTin",
  "lineExtensionAmount",
  "taxAmount",
  "totalAmount",
  "notes",
] as const;

export type OutboundPortalField = (typeof OUTBOUND_CSV_HEADERS)[number];

export const OUTBOUND_CSV_FIELD_LABELS: Record<OutboundPortalField, string> = {
  documentType: "Document type",
  documentNumber: "Document number",
  issueDate: "Issue date (YYYY-MM-DD)",
  currency: "Currency",
  counterpartName: "Counterpart name",
  counterpartTin: "Counterpart TIN",
  lineExtensionAmount: "Line extension amount",
  taxAmount: "Tax amount",
  totalAmount: "Total amount",
  notes: "Notes",
};

/** Max data rows accepted per CSV upload (excluding header). */
export const OUTBOUND_CSV_MAX_ROWS = 200;

/**
 * Default ERP source key → portal field map (SAP B1–style sample keys).
 * Stored on new ErpConnection rows and used by sandbox pull.
 */
export const DEFAULT_ERP_FIELD_MAP: Record<string, OutboundPortalField> = {
  DocType: "documentType",
  DocNum: "documentNumber",
  DocDate: "issueDate",
  DocCurrency: "currency",
  CardName: "counterpartName",
  LicTradNum: "counterpartTin",
  DocTotalNet: "lineExtensionAmount",
  VatSum: "taxAmount",
  DocTotal: "totalAmount",
  Comments: "notes",
};

export function formatDefaultFieldMapHelp(): string {
  return Object.entries(DEFAULT_ERP_FIELD_MAP)
    .map(([source, portal]) => `${source} → ${portal}`)
    .join(", ");
}

/** Apply ERP fieldMap (source → portal) to a raw ERP payload. */
export function applyErpFieldMap(
  payload: Record<string, unknown>,
  fieldMap: Record<string, string> | null | undefined,
): Record<string, string> {
  const map =
    fieldMap && Object.keys(fieldMap).length > 0
      ? fieldMap
      : DEFAULT_ERP_FIELD_MAP;
  const result: Record<string, string> = {};

  for (const [sourceKey, portalField] of Object.entries(map)) {
    if (!portalField?.trim()) continue;
    const raw = payload[sourceKey];
    if (raw === undefined || raw === null) continue;
    result[portalField] = String(raw);
  }

  return result;
}

export function buildOutboundCsvTemplate(): string {
  const header = OUTBOUND_CSV_HEADERS.join(",");
  const sample = [
    "sales_invoice",
    "SI-SAMPLE-001",
    "2026-08-10",
    "PHP",
    "Sample Customer Corp",
    "000-000-000-00000",
    "1000.00",
    "120.00",
    "1120.00",
    "Sample row — replace with your data",
  ].join(",");
  return `${header}\n${sample}\n`;
}
