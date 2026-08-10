import Link from "next/link";

import type { DocumentDirection } from "@/features/documents/lib/document-list-shared";
import { cn } from "@/utils/cn";

export interface StatusFilterOption {
  value: string;
  label: string;
}

export interface DocumentListQueryState {
  status?: string;
  q?: string;
  documentType?: string;
}

function buildFilterHref(
  direction: DocumentDirection,
  next: DocumentListQueryState,
) {
  const base = direction === "outbound" ? "/outbound" : "/inbound";
  const params = new URLSearchParams();
  if (next.status) params.set("status", next.status);
  if (next.q) params.set("q", next.q);
  if (next.documentType) params.set("documentType", next.documentType);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function DocumentStatusFilter({
  direction,
  options,
  activeStatus,
  q,
  documentType,
}: {
  direction: DocumentDirection;
  options: StatusFilterOption[];
  activeStatus?: string;
  q?: string;
  documentType?: string;
}) {
  const preserved: DocumentListQueryState = {
    ...(q ? { q } : {}),
    ...(documentType ? { documentType } : {}),
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={buildFilterHref(direction, preserved)}
        className={cn(
          "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
          !activeStatus
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80",
        )}
      >
        All
      </Link>
      {options.map((option) => {
        const href = buildFilterHref(direction, {
          ...preserved,
          status: option.value,
        });
        const active = activeStatus === option.value;
        return (
          <Link
            key={option.value}
            href={href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
