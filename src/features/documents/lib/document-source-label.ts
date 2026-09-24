export type DocumentSourceFields = {
  source: string;
  sourceSystem?: string | null;
  sourceLabel?: string | null;
};

/**
 * Short end-user label for where an outbound document was ingested from.
 * ERP sync is always "ERP" (no provider or connection name in the list).
 */
export function formatDocumentSourceLabel(doc: DocumentSourceFields): string {
  switch (doc.source) {
    case "manual":
      return "Manual";
    case "import":
      return "Excel";
    case "erp_sync":
      return "ERP";
    default:
      return "Manual";
  }
}
