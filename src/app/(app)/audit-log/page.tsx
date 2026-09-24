import { History } from "lucide-react";

import { PageHeaderCard } from "@/app/(app)/_components/page-header-card";
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
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";
import { cn } from "@/utils/cn";

export const metadata = {
  title: "Audit Logs · BIR EIS",
};

const PAGE_SIZE = 25;

function formatAuditTime(date: Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function summarizeMetadata(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "—";
  }

  const record = metadata as Record<string, unknown>;
  const parts: string[] = [];

  if (typeof record.name === "string") parts.push(`Name: ${record.name}`);
  if (typeof record.tin === "string") parts.push(`TIN: ${record.tin}`);
  if (typeof record.environment === "string") {
    parts.push(`Env: ${record.environment}`);
  }
  if (typeof record.pttStatus === "string") {
    parts.push(`PTT: ${record.pttStatus}`);
  }
  if (record.apiKeyUpdated === true) {
    const last4 =
      typeof record.apiKeyLast4 === "string" ? record.apiKeyLast4 : null;
    parts.push(last4 ? `API key updated (…${last4})` : "API key updated");
  }
  if (record.taglineChanged === true) parts.push("Tagline updated");
  if (record.logoChanged === true) parts.push("Logo updated");
  if (typeof record.direction === "string") {
    parts.push(`Direction: ${record.direction}`);
  }
  if (typeof record.surface === "string") {
    parts.push(`From: ${record.surface}`);
  }
  if (typeof record.documentNumber === "string") {
    parts.push(`Doc: ${record.documentNumber}`);
  }
  if (typeof record.status === "string") {
    parts.push(`Status: ${record.status}`);
  }
  if (typeof record.cancellationStatus === "string") {
    parts.push(`Cancel: ${record.cancellationStatus}`);
  }
  if (typeof record.reason === "string") {
    parts.push(`Reason: ${record.reason.replace(/_/g, " ")}`);
  }
  if (typeof record.remarks === "string" && record.remarks.trim()) {
    parts.push(`Remarks: ${record.remarks.trim()}`);
  }
  if (typeof record.eisAckStatus === "string") {
    parts.push(`EIS response: ${record.eisAckStatus}`);
  }
  if (typeof record.syncedCount === "number") {
    parts.push(`Synced: ${record.syncedCount}`);
  }
  if (typeof record.cancellationSyncedCount === "number") {
    parts.push(`Cancellations synced: ${record.cancellationSyncedCount}`);
  }

  return parts.length > 0 ? parts.join(" · ") : "—";
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await requirePermission("audit.view");
  const params = await searchParams;
  const pageRaw = Number(params.page ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const skip = (page - 1) * PAGE_SIZE;

  const where = { tenantId: session.user.tenantId };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rangeStart = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, total);

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeaderCard
        icon={<History className="size-5" />}
        title="Audit Logs"
        description="Recent changes in your organization—settings, credentials, and more."
      />

      {total === 0 ? (
        <div className={cn(tableCardClassName, "px-6 py-14 text-center")}>
          <p className="text-base font-medium text-foreground">
            No activity yet
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            When someone updates organization settings or EIS credentials,
            those events will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatAuditTime(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    {log.user?.name || log.user?.email || "System"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.action}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.entityType}
                    {log.entityId ? (
                      <span className="ml-1 font-mono text-[11px] opacity-70">
                        · {log.entityId.slice(0, 8)}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="max-w-md whitespace-normal break-words text-muted-foreground">
                    {summarizeMetadata(log.metadata)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            total={total}
            summary={
              totalPages > 1
                ? `Page ${safePage} of ${totalPages} · ${total} events`
                : `${total} events`
            }
            prevHref={
              safePage > 1 ? `/audit-log?page=${safePage - 1}` : undefined
            }
            nextHref={
              safePage < totalPages
                ? `/audit-log?page=${safePage + 1}`
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
