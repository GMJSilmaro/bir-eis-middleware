import Link from "next/link";

import {
  DocumentStatusBadge,
  EisAckStatusBadge,
} from "@/features/documents/components/document-status-badge";
import {
  formatDocumentType,
  formatIssueDate,
  formatMoney,
} from "@/features/documents/lib/document-format";
import type { DocumentDirection } from "@/features/documents/lib/document-queries";
import { DOCUMENT_PAGE_SIZE } from "@/features/documents/lib/document-queries";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  tableCardClassName,
} from "@/components/ui/table";
import { cn } from "@/utils/cn";

export interface DocumentListRow {
  id: string;
  documentType: string;
  status: string;
  documentNumber: string;
  issueDate: Date;
  currency: string;
  counterpartName: string;
  totalAmount: { toString(): string } | string | number;
  eisAckStatus?: string | null;
}

export interface DocumentListFiltersState {
  status?: string;
  q?: string;
  documentType?: string;
}

export interface DocumentListTableProps {
  direction: DocumentDirection;
  documents: DocumentListRow[];
  total: number;
  page: number;
  totalPages: number;
  filters?: DocumentListFiltersState;
  emptyTitle: string;
  emptyDescription: string;
}

function buildListHref(
  direction: DocumentDirection,
  page: number,
  filters?: DocumentListFiltersState,
) {
  const base = direction === "outbound" ? "/outbound" : "/inbound";
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (filters?.status) params.set("status", filters.status);
  if (filters?.q) params.set("q", filters.q);
  if (filters?.documentType) params.set("documentType", filters.documentType);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function DocumentListTable({
  direction,
  documents,
  total,
  page,
  totalPages,
  filters,
  emptyTitle,
  emptyDescription,
}: DocumentListTableProps) {
  const detailBase = direction === "outbound" ? "/outbound" : "/inbound";
  const rangeStart = total === 0 ? 0 : (page - 1) * DOCUMENT_PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * DOCUMENT_PAGE_SIZE, total);

  if (total === 0) {
    return (
      <div
        className={cn(
          tableCardClassName,
          "px-6 py-14 text-center",
        )}
      >
        <p className="text-base font-medium text-foreground">{emptyTitle}</p>
        <p className="mt-2 text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Counterpart</TableHead>
            <TableHead>Issue date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>EIS response</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>
                <Link
                  href={`${detailBase}/${doc.id}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {doc.documentNumber}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDocumentType(doc.documentType)}
              </TableCell>
              <TableCell>{doc.counterpartName}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatIssueDate(doc.issueDate)}
              </TableCell>
              <TableCell className="whitespace-nowrap tabular-nums">
                {formatMoney(doc.totalAmount, doc.currency)}
              </TableCell>
              <TableCell>
                <DocumentStatusBadge
                  status={doc.status}
                  direction="outbound"
                />
              </TableCell>
              <TableCell>
                <EisAckStatusBadge status={doc.eisAckStatus} />
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm">
                  <Link href={`${detailBase}/${doc.id}`}>View details</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TablePagination
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        total={total}
        prevHref={
          page > 1 ? buildListHref(direction, page - 1, filters) : undefined
        }
        nextHref={
          page < totalPages
            ? buildListHref(direction, page + 1, filters)
            : undefined
        }
      />
    </div>
  );
}
