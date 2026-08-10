import { DocumentSearchFilters } from "@/features/documents/components/document-search-filters";
import {
  DocumentStatusFilter,
  type StatusFilterOption,
} from "@/features/documents/components/document-status-filter";
import type { DocumentDirection } from "@/features/documents/lib/document-queries";
import { tableCardClassName } from "@/components/ui/table";
import { cn } from "@/utils/cn";

export interface DocumentFiltersCardProps {
  direction: DocumentDirection;
  q?: string;
  documentType?: string;
  status?: string;
  statusOptions: StatusFilterOption[];
}

export function DocumentFiltersCard({
  direction,
  q,
  documentType,
  status,
  statusOptions,
}: DocumentFiltersCardProps) {
  return (
    <div className={cn(tableCardClassName, "space-y-4 p-4 sm:p-5")}>
      <DocumentSearchFilters
        direction={direction}
        q={q}
        documentType={documentType}
        status={status}
      />
      <DocumentStatusFilter
        direction={direction}
        activeStatus={status}
        q={q}
        documentType={documentType}
        options={statusOptions}
      />
    </div>
  );
}
