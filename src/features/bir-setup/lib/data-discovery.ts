/**
 * ERP sample field discovery + lightweight data-quality scan.
 * Never transmits samples to BIR.
 */

export type DiscoveryFieldStatus = "FOUND" | "PARTIAL" | "NOT_FOUND";

export type DiscoveryFieldResult = {
  key: string;
  label: string;
  status: DiscoveryFieldStatus;
  sampleValue?: string | null;
};

export type DiscoveryResult = {
  source: "erp_sandbox" | "json_upload" | "csv_upload" | "xml_upload";
  sampleCount: number;
  fields: DiscoveryFieldResult[];
  discoveredAt: string;
};

export type QualityIssueSeverity = "ERROR" | "WARNING" | "INFO";

export type QualityIssue = {
  code: string;
  severity: QualityIssueSeverity;
  message: string;
  count?: number;
};

export type QualityScanResult = {
  customersAnalyzed: number;
  productsAnalyzed: number;
  transactionsSampled: number;
  validTin: number;
  missingTin: number;
  invalidTinFormat: number;
  taxMismatch: number;
  missingReferences: number;
  duplicateInvoiceNumbers: number;
  issues: QualityIssue[];
  errors: number;
  warnings: number;
  scannedAt: string;
};

const DISCOVERY_CATALOG: Array<{ key: string; label: string; aliases: string[] }> = [
  { key: "sellerTin", label: "Seller TIN", aliases: ["SellerTin", "tin", "CompanyTIN"] },
  { key: "sellerName", label: "Seller Name", aliases: ["SellerName", "CompanyName", "CardName"] },
  { key: "branch", label: "Branch", aliases: ["BranchCode", "Branch", "BPLId"] },
  { key: "invoiceNumber", label: "Invoice Number", aliases: ["DocNum", "documentNumber", "InvoiceNumber"] },
  { key: "invoiceDate", label: "Invoice Date", aliases: ["DocDate", "issueDate", "InvoiceDate"] },
  { key: "documentType", label: "Document Type", aliases: ["DocType", "documentType"] },
  { key: "buyerName", label: "Buyer Name", aliases: ["CardName", "counterpartName", "BuyerName"] },
  { key: "buyerTin", label: "Buyer TIN", aliases: ["LicTradNum", "counterpartTin", "BuyerTin", "FederalTaxID"] },
  { key: "lineItems", label: "Line Items", aliases: ["DocumentLines", "lineItems", "Items"] },
  { key: "quantity", label: "Quantity", aliases: ["Quantity", "Qty"] },
  { key: "unitPrice", label: "Unit Price", aliases: ["Price", "UnitPrice", "unitPrice"] },
  { key: "vatableSales", label: "VATable Sales", aliases: ["DocTotalNet", "lineExtensionAmount", "VATable"] },
  { key: "vatAmount", label: "VAT Amount", aliases: ["VatSum", "taxAmount", "VAT"] },
  { key: "vatExempt", label: "VAT Exempt", aliases: ["VatExempt", "Exempt"] },
  { key: "zeroRated", label: "Zero Rated", aliases: ["ZeroRated", "ZeroRate"] },
  { key: "currency", label: "Currency", aliases: ["DocCurrency", "currency", "Currency"] },
  { key: "exchangeRate", label: "Exchange Rate", aliases: ["DocRate", "ExchangeRate"] },
  { key: "originalDocumentRef", label: "Original Document Ref", aliases: ["OriginalRef", "BaseEntry", "originalDocumentId"] },
];

function collectKeys(value: unknown, into: Set<string>, prefix = ""): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value.slice(0, 5)) collectKeys(item, into, prefix);
    return;
  }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    into.add(k);
    into.add(path);
    if (v && typeof v === "object") collectKeys(v, into, path);
  }
}

function findSampleValue(
  samples: Record<string, unknown>[],
  aliases: string[],
): string | null {
  for (const sample of samples) {
    for (const alias of aliases) {
      if (sample[alias] !== undefined && sample[alias] !== null && sample[alias] !== "") {
        const raw = sample[alias];
        if (typeof raw === "object") return "[object]";
        return String(raw).slice(0, 80);
      }
    }
  }
  return null;
}

export function discoverFieldsFromSamples(params: {
  samples: Record<string, unknown>[];
  source: DiscoveryResult["source"];
}): DiscoveryResult {
  const keySet = new Set<string>();
  for (const sample of params.samples) collectKeys(sample, keySet);

  const fields: DiscoveryFieldResult[] = DISCOVERY_CATALOG.map((entry) => {
    const hit = entry.aliases.some((a) => keySet.has(a));
    const sampleValue = findSampleValue(params.samples, entry.aliases);
    let status: DiscoveryFieldStatus = "NOT_FOUND";
    if (hit && sampleValue) status = "FOUND";
    else if (hit) status = "PARTIAL";
    return {
      key: entry.key,
      label: entry.label,
      status,
      sampleValue,
    };
  });

  return {
    source: params.source,
    sampleCount: params.samples.length,
    fields,
    discoveredAt: new Date().toISOString(),
  };
}

function isValidTinFormat(tin: string | null | undefined): boolean {
  if (!tin) return false;
  const digits = tin.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 14;
}

export function runDataQualityScan(
  samples: Record<string, unknown>[],
): QualityScanResult {
  const buyers = new Map<string, { tin?: string; name?: string }>();
  const invoiceNumbers = new Set<string>();
  let duplicateInvoiceNumbers = 0;
  let missingTin = 0;
  let invalidTinFormat = 0;
  let taxMismatch = 0;
  let missingReferences = 0;

  for (const sample of samples) {
    const buyerKey =
      String(sample.CardCode ?? sample.counterpartName ?? sample.BuyerName ?? Math.random());
    const tin = String(
      sample.LicTradNum ?? sample.counterpartTin ?? sample.BuyerTin ?? "",
    ).trim();
    const name = String(
      sample.CardName ?? sample.counterpartName ?? sample.BuyerName ?? "",
    ).trim();
    buyers.set(buyerKey, { tin: tin || undefined, name: name || undefined });

    const docNum = String(sample.DocNum ?? sample.documentNumber ?? "").trim();
    if (docNum) {
      if (invoiceNumbers.has(docNum)) duplicateInvoiceNumbers += 1;
      invoiceNumbers.add(docNum);
    } else {
      missingReferences += 1;
    }

    const net = Number(sample.DocTotalNet ?? sample.lineExtensionAmount ?? NaN);
    const vat = Number(sample.VatSum ?? sample.taxAmount ?? NaN);
    const total = Number(sample.DocTotal ?? sample.totalAmount ?? NaN);
    if (
      Number.isFinite(net) &&
      Number.isFinite(vat) &&
      Number.isFinite(total) &&
      Math.abs(net + vat - total) > 0.02
    ) {
      taxMismatch += 1;
    }
  }

  for (const buyer of buyers.values()) {
    if (!buyer.tin) missingTin += 1;
    else if (!isValidTinFormat(buyer.tin)) invalidTinFormat += 1;
  }

  const validTin = buyers.size - missingTin - invalidTinFormat;
  const issues: QualityIssue[] = [];

  if (missingTin > 0) {
    issues.push({
      code: "BUYER_TIN_MISSING",
      severity: "ERROR",
      message: "Buyer TIN missing on sampled transactions",
      count: missingTin,
    });
  }
  if (invalidTinFormat > 0) {
    issues.push({
      code: "BUYER_TIN_INVALID",
      severity: "ERROR",
      message: "Buyer TIN has invalid format",
      count: invalidTinFormat,
    });
  }
  if (taxMismatch > 0) {
    issues.push({
      code: "TAX_TOTAL_MISMATCH",
      severity: "ERROR",
      message: "Line + tax does not match total on sample rows",
      count: taxMismatch,
    });
  }
  if (missingReferences > 0) {
    issues.push({
      code: "MISSING_DOC_NUMBER",
      severity: "WARNING",
      message: "Document number missing on sample rows",
      count: missingReferences,
    });
  }
  if (duplicateInvoiceNumbers > 0) {
    issues.push({
      code: "DUPLICATE_INVOICE",
      severity: "ERROR",
      message: "Duplicate invoice numbers in sample",
      count: duplicateInvoiceNumbers,
    });
  }
  if (issues.length === 0) {
    issues.push({
      code: "QUALITY_OK",
      severity: "INFO",
      message: "No blocking data-quality issues in the sample set",
    });
  }

  return {
    customersAnalyzed: buyers.size,
    productsAnalyzed: 0,
    transactionsSampled: samples.length,
    validTin: Math.max(0, validTin),
    missingTin,
    invalidTinFormat,
    taxMismatch,
    missingReferences,
    duplicateInvoiceNumbers,
    issues,
    errors: issues.filter((i) => i.severity === "ERROR").length,
    warnings: issues.filter((i) => i.severity === "WARNING").length,
    scannedAt: new Date().toISOString(),
  };
}

export function parseJsonSamples(raw: string): Record<string, unknown>[] {
  const parsed = JSON.parse(raw) as unknown;
  if (Array.isArray(parsed)) {
    return parsed.filter((row) => row && typeof row === "object") as Record<
      string,
      unknown
    >[];
  }
  if (parsed && typeof parsed === "object") {
    return [parsed as Record<string, unknown>];
  }
  throw new Error("JSON must be an object or array of objects");
}

export function parseCsvSamples(raw: string): Record<string, unknown>[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) throw new Error("CSV needs a header row and at least one data row");
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1, 201).map((line) => {
    const cols = line.split(",");
    const row: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      row[h] = (cols[i] ?? "").trim();
    });
    return row;
  });
}

/** Minimal XML tag → flat object extraction for discovery (not a full XML parser). */
export function parseXmlSamples(raw: string): Record<string, unknown>[] {
  const tagMatches = [...raw.matchAll(/<([A-Za-z][\w.-]*)>([^<]*)<\/\1>/g)];
  if (tagMatches.length === 0) {
    throw new Error("No simple XML elements found");
  }
  const row: Record<string, unknown> = {};
  for (const match of tagMatches) {
    row[match[1]] = match[2];
  }
  return [row];
}
