import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileOutput } from "lucide-react";

import { PageHeaderCard } from "@/app/(app)/_components/page-header-card";
import { DocumentContentCard } from "@/features/documents/components/document-content-card";
import {
  DocumentStatusBadge,
  EisAckStatusBadge,
} from "@/features/documents/components/document-status-badge";
import { QueueOutboundButton } from "@/features/documents/components/outbound-document-actions";
import { OutboundDocumentForm } from "@/features/documents/components/outbound-document-form";
import {
  formatDocumentType,
  formatIssueDate,
  formatMoney,
  toDateInputValue,
} from "@/features/documents/lib/document-format";
import { getDocumentById } from "@/features/documents/lib/document-queries";
import { Button } from "@/components/ui/button";
import {
  hasPermission,
  requirePermission,
} from "@/lib/auth/permissions";

export const metadata = {
  title: "Outbound document · BIR EIS",
};

function formatDateTime(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function OutboundDocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission("documents.view");
  const { id } = await params;
  const document = await getDocumentById(session.user.tenantId, id);

  if (!document || document.direction !== "outbound") {
    notFound();
  }

  const canManage = hasPermission(
    session.user.permissions,
    "documents.manage",
  );
  const isDraft = document.status === "draft";
  const canQueue = canManage && isDraft;
  const showResponseInboxLink =
    document.status === "queued" ||
    document.status === "submitted" ||
    document.status === "accepted" ||
    document.status === "rejected";

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeaderCard
        icon={<FileOutput className="size-5" />}
        title={document.documentNumber}
        description={`${formatDocumentType(document.documentType)} · ${document.counterpartName}`}
        aside={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {showResponseInboxLink ? (
              <Button asChild variant="onNavy">
                <Link href={`/inbound/${document.id}`}>View EIS response</Link>
              </Button>
            ) : null}
            <Button asChild variant="onNavyOutline">
              <Link href="/outbound">
                <ArrowLeft className="size-4" />
                Back to list
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <DocumentContentCard title="Summary" className="lg:col-span-1">
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <DocumentStatusBadge
                  status={document.status}
                  direction="outbound"
                />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Issue date</dt>
              <dd>{formatIssueDate(document.issueDate)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Net</dt>
              <dd className="tabular-nums">
                {formatMoney(document.lineExtensionAmount, document.currency)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Tax</dt>
              <dd className="tabular-nums">
                {formatMoney(document.taxAmount, document.currency)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Total</dt>
              <dd className="font-semibold tabular-nums">
                {formatMoney(document.totalAmount, document.currency)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">EIS response</dt>
              <dd>
                <EisAckStatusBadge status={document.eisAckStatus} />
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground">Reference</dt>
              <dd className="max-w-[60%] text-right font-mono text-xs break-all">
                {document.eisReferenceId || "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Submitted</dt>
              <dd className="text-right text-muted-foreground">
                {formatDateTime(document.submittedAt)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Responded at</dt>
              <dd className="text-right text-muted-foreground">
                {formatDateTime(document.eisAckAt)}
              </dd>
            </div>
            {document.eisAckMessage ? (
              <div className="space-y-1 border-t border-border/50 pt-3">
                <dt className="text-muted-foreground">Response message</dt>
                <dd className="text-foreground">{document.eisAckMessage}</dd>
              </div>
            ) : null}
            {document.notes ? (
              <div className="space-y-1 border-t border-border/50 pt-3">
                <dt className="text-muted-foreground">Notes</dt>
                <dd className="text-foreground">{document.notes}</dd>
              </div>
            ) : null}
          </dl>
        </DocumentContentCard>

        <div className="space-y-5 lg:col-span-2">
          {isDraft && canManage ? (
            <DocumentContentCard
              title="Edit draft"
              description="Update details before queueing for transmission to BIR EIS."
            >
              <OutboundDocumentForm
                mode="edit"
                initial={{
                  id: document.id,
                  documentType: document.documentType,
                  documentNumber: document.documentNumber,
                  issueDate: toDateInputValue(document.issueDate),
                  currency: document.currency,
                  counterpartName: document.counterpartName,
                  counterpartTin: document.counterpartTin ?? "",
                  lineExtensionAmount: document.lineExtensionAmount.toString(),
                  taxAmount: document.taxAmount.toString(),
                  totalAmount: document.totalAmount.toString(),
                  notes: document.notes ?? "",
                }}
              />
            </DocumentContentCard>
          ) : (
            <DocumentContentCard title="Document details">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Type</dt>
                  <dd>{formatDocumentType(document.documentType)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Counterpart TIN</dt>
                  <dd>{document.counterpartTin || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Counterpart</dt>
                  <dd>{document.counterpartName}</dd>
                </div>
              </dl>
            </DocumentContentCard>
          )}

          {canQueue ? (
            <DocumentContentCard
              title="Queue"
              description="Mark this draft as ready for transmission. Live EIS send comes in a later release. Use Inbound → Sync from EIS to refresh sandbox responses."
            >
              <QueueOutboundButton documentId={document.id} />
            </DocumentContentCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
