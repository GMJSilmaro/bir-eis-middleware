/** Shared FormData parsers for document server actions. */

export function readDocumentFormFields(formData: FormData) {
  return {
    documentType: formData.get("documentType"),
    documentNumber: formData.get("documentNumber"),
    issueDate: formData.get("issueDate"),
    currency: formData.get("currency") || "PHP",
    counterpartName: formData.get("counterpartName"),
    counterpartTin: formData.get("counterpartTin") ?? "",
    lineExtensionAmount: formData.get("lineExtensionAmount"),
    taxAmount: formData.get("taxAmount"),
    totalAmount: formData.get("totalAmount"),
    notes: formData.get("notes") ?? "",
  };
}

export function toNullableNotes(notes: string | undefined): string | null {
  const trimmed = notes?.trim();
  return trimmed ? trimmed : null;
}

export function toNullableTin(tin: string | undefined): string | null {
  const trimmed = tin?.trim();
  return trimmed ? trimmed : null;
}
