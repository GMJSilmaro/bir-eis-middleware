import type { OutboundPortalField } from "@/features/documents/lib/bir-portal-field-map";
import { DEFAULT_ERP_FIELD_MAP } from "@/features/documents/lib/bir-portal-field-map";

/** Canonical middleware fields used for ERP → middleware → EIS mapping. */
export const CANONICAL_FIELDS = [
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
  "sourceErpId",
  "buyer.customerCode",
] as const;

export type CanonicalField = (typeof CANONICAL_FIELDS)[number];

/** Required before production activation. */
export const REQUIRED_CANONICAL_FIELDS: CanonicalField[] = [
  "documentType",
  "documentNumber",
  "issueDate",
  "counterpartName",
  "lineExtensionAmount",
  "taxAmount",
  "totalAmount",
];

/** Suggested EIS / CAS field names (draft shape — confirm against official specs). */
export const CANONICAL_TO_EIS: Record<string, string> = {
  documentType: "DocType",
  documentNumber: "InvoiceNumber",
  issueDate: "IssueDtm",
  currency: "Currency",
  counterpartName: "Buyer.RegisteredName",
  counterpartTin: "Buyer.Tin",
  lineExtensionAmount: "Amounts.LinesTotalAmt",
  taxAmount: "Amounts.TaxAmt",
  totalAmount: "Amounts.TotalAmt",
  notes: "Remark",
  sourceErpId: "SourceDocumentId",
  "buyer.customerCode": "Buyer.CustomerCode",
};

export function defaultMappingsFromLegacyFieldMap(
  fieldMap: Record<string, string> | null | undefined,
): Array<{
  erpField: string;
  canonicalField: string;
  eisField: string;
  required: boolean;
}> {
  const map =
    fieldMap && Object.keys(fieldMap).length > 0
      ? fieldMap
      : DEFAULT_ERP_FIELD_MAP;

  return Object.entries(map).map(([erpField, canonicalField]) => ({
    erpField,
    canonicalField,
    eisField: CANONICAL_TO_EIS[canonicalField] ?? canonicalField,
    required: REQUIRED_CANONICAL_FIELDS.includes(
      canonicalField as OutboundPortalField & CanonicalField,
    ),
  }));
}

export function unmappedRequiredFields(
  mappings: Array<{ canonicalField: string }>,
): string[] {
  const mapped = new Set(mappings.map((m) => m.canonicalField));
  return REQUIRED_CANONICAL_FIELDS.filter((f) => !mapped.has(f));
}
