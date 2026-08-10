import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
} from "@/features/documents/schemas/document.schema";
import type { DocumentDirection } from "@/features/documents/lib/document-list-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { settingsFieldClassName } from "@/features/settings/lib/field-styles";
import { cn } from "@/utils/cn";

export function DocumentSearchFilters({
  direction,
  q,
  documentType,
  status,
}: {
  direction: DocumentDirection;
  q?: string;
  documentType?: string;
  status?: string;
}) {
  const action = direction === "outbound" ? "/outbound" : "/inbound";

  return (
    <form
      action={action}
      method="get"
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
    >
      {status ? <input type="hidden" name="status" value={status} /> : null}

      <div className="min-w-48 flex-1 space-y-1">
        <label
          htmlFor="document-q"
          className="text-xs font-medium text-muted-foreground"
        >
          Search
        </label>
        <Input
          id="document-q"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Document number or counterpart"
          className="rounded-lg"
        />
      </div>

      <div className="w-full space-y-1 sm:w-56">
        <label
          htmlFor="document-type"
          className="text-xs font-medium text-muted-foreground"
        >
          Document type
        </label>
        <select
          id="document-type"
          name="documentType"
          defaultValue={documentType ?? ""}
          className={cn(settingsFieldClassName, "h-9 rounded-lg")}
        >
          <option value="">All types</option>
          {DOCUMENT_TYPES.map((value) => (
            <option key={value} value={value}>
              {DOCUMENT_TYPE_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" variant="outline">
        Apply
      </Button>
    </form>
  );
}
