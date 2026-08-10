import {
  OUTBOUND_CSV_HEADERS,
  OUTBOUND_CSV_MAX_ROWS,
  type OutboundPortalField,
} from "@/features/documents/lib/bir-portal-field-map";
import type {
  IngestRowError,
  IngestRowInput,
} from "@/features/documents/lib/create-outbound-drafts";

export type ParseOutboundCsvResult = {
  rows: IngestRowInput[];
  errors: IngestRowError[];
};

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function normalizeHeader(value: string): string {
  return value.trim().replace(/^\uFEFF/, "");
}

/**
 * Parse CSV text into portal field rows. Returns structural errors (missing headers, over limit).
 * Row validation (Zod) happens in `createOutboundDrafts`.
 */
export function parseOutboundCsv(text: string): ParseOutboundCsvResult {
  const errors: IngestRowError[] = [];
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

  if (!normalized) {
    return {
      rows: [],
      errors: [{ row: 0, message: "CSV file is empty" }],
    };
  }

  const lines = normalized.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return {
      rows: [],
      errors: [
        {
          row: 0,
          message: "CSV must include a header row and at least one data row",
        },
      ],
    };
  }

  const headers = splitCsvLine(lines[0]).map(normalizeHeader);
  const required = OUTBOUND_CSV_HEADERS as readonly string[];
  const missing = required.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [
        {
          row: 1,
          message: `Missing required columns: ${missing.join(", ")}`,
        },
      ],
    };
  }

  const dataLineCount = lines.length - 1;
  if (dataLineCount > OUTBOUND_CSV_MAX_ROWS) {
    return {
      rows: [],
      errors: [
        {
          row: 0,
          message: `CSV has ${dataLineCount} data rows; maximum is ${OUTBOUND_CSV_MAX_ROWS}`,
        },
      ],
    };
  }

  const indexByHeader = new Map(
    headers.map((header, index) => [header, index] as const),
  );
  const rows: IngestRowInput[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const rowNumber = i + 1;
    const cells = splitCsvLine(lines[i]);
    const fields: Record<string, string> = {};

    for (const header of OUTBOUND_CSV_HEADERS) {
      const idx = indexByHeader.get(header);
      const value = idx === undefined ? "" : (cells[idx] ?? "");
      fields[header as OutboundPortalField] = value;
    }

    rows.push({ row: rowNumber, fields });
  }

  return { rows, errors };
}
