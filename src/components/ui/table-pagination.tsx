import Link from "next/link";

import { Button } from "@/components/ui/button";

export interface TablePaginationProps {
  rangeStart: number;
  rangeEnd: number;
  total: number;
  prevHref?: string;
  nextHref?: string;
  /** Optional label override when total is shown without a range (e.g. audit). */
  summary?: string;
}

export function TablePagination({
  rangeStart,
  rangeEnd,
  total,
  prevHref,
  nextHref,
  summary,
}: TablePaginationProps) {
  const label =
    summary ??
    (total === 0
      ? "Showing 0 of 0"
      : `Showing ${rangeStart}–${rangeEnd} of ${total}`);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex justify-end gap-2">
        {prevHref ? (
          <Button asChild variant="outline" size="sm">
            <Link href={prevHref}>Previous</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
        )}
        {nextHref ? (
          <Button asChild variant="outline" size="sm">
            <Link href={nextHref}>Next</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
