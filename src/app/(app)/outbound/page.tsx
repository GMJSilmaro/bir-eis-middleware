import { FileOutput } from "lucide-react";

import { PageHeaderCard } from "@/app/(app)/_components/page-header-card";
import { DocumentFiltersCard } from "@/features/documents/components/document-filters-card";
import { DocumentListTable } from "@/features/documents/components/document-list-table";
import { NewDocumentChooser } from "@/features/documents/components/new-document-chooser";
import { listDocuments } from "@/features/documents/lib/document-queries";
import {
  DOCUMENT_TYPES,
  OUTBOUND_STATUSES,
  OUTBOUND_STATUS_LABELS,
} from "@/features/documents/schemas/document.schema";
import {
  hasPermission,
  requirePermission,
} from "@/lib/auth/permissions";

export const metadata = {
  title: "Outbound · BIR EIS",
};

export default async function OutboundPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    status?: string;
    q?: string;
    documentType?: string;
  }>;
}) {
  const session = await requirePermission("documents.view");
  const params = await searchParams;
  const pageRaw = Number(params.page ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const status =
    params.status &&
    (OUTBOUND_STATUSES as readonly string[]).includes(params.status)
      ? params.status
      : undefined;
  const documentType =
    params.documentType &&
    (DOCUMENT_TYPES as readonly string[]).includes(params.documentType)
      ? params.documentType
      : undefined;
  const q = params.q?.trim() || undefined;

  const { total, documents, page: safePage, totalPages } = await listDocuments({
    tenantId: session.user.tenantId,
    direction: "outbound",
    status,
    documentType,
    q,
    page,
  });

  const canManage = hasPermission(
    session.user.permissions,
    "documents.manage",
  );

  const filters = { status, q, documentType };

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeaderCard
        icon={<FileOutput className="size-5" />}
        title="Outbound"
        description="Prepare invoices and receipts, then queue them for submission to BIR EIS."
        aside={canManage ? <NewDocumentChooser /> : null}
      />

      <DocumentFiltersCard
        direction="outbound"
        q={q}
        documentType={documentType}
        status={status}
        statusOptions={OUTBOUND_STATUSES.map((value) => ({
          value,
          label: OUTBOUND_STATUS_LABELS[value],
        }))}
      />

      <DocumentListTable
        direction="outbound"
        documents={documents}
        total={total}
        page={safePage}
        totalPages={totalPages}
        filters={filters}
        emptyTitle={
          status || q || documentType
            ? "No documents match these filters"
            : "No outbound documents yet"
        }
        emptyDescription={
          canManage
            ? "Create a draft sales invoice or receipt, queue it for transmission, then check Inbound for EIS responses."
            : "When your team prepares outbound invoices, they will appear here."
        }
      />
    </div>
  );
}
