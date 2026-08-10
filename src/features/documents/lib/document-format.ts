import {
  DOCUMENT_TYPE_LABELS,
  type DOCUMENT_TYPES,
} from "@/features/documents/schemas/document.schema";

export function formatDocumentType(documentType: string): string {
  return (
    DOCUMENT_TYPE_LABELS[documentType as (typeof DOCUMENT_TYPES)[number]] ??
    documentType.replace(/_/g, " ")
  );
}

export function formatIssueDate(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
  }).format(value);
}

export function formatMoney(
  amount: { toString(): string } | string | number,
  currency = "PHP",
): string {
  const value =
    typeof amount === "number" ? amount : Number(amount.toString());
  if (!Number.isFinite(value)) return String(amount);

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function toDateInputValue(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function counterpartInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}
