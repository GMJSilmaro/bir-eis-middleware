import Link from "next/link";
import { History } from "lucide-react";

import { PageHeaderCard } from "@/app/(app)/_components/page-header-card";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

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

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeaderCard
        icon={<History className="size-5" />}
        title="Audit Logs"
        description="Recent changes in your organization—settings, credentials, and more."
      />

      {total === 0 ? (
        <div className="rounded-2xl border-transparent bg-card px-6 py-14 text-center shadow-[0_6px_22px_rgba(15,23,42,0.07)]">
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
          <div className="overflow-hidden rounded-2xl border-transparent bg-card shadow-[0_6px_22px_rgba(15,23,42,0.07)]">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">Summary</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatAuditTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {log.user?.name || log.user?.email || "System"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.entityType}
                      {log.entityId ? (
                        <span className="ml-1 font-mono text-[11px] opacity-70">
                          · {log.entityId.slice(0, 8)}
                        </span>
                      ) : null}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                      {summarizeMetadata(log.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Page {safePage} of {totalPages} · {total} events
              </p>
              <div className="flex gap-2">
                {safePage > 1 ? (
                  <Button asChild variant="outline" size="sm" className="rounded-lg">
                    <Link href={`/audit-log?page=${safePage - 1}`}>Previous</Link>
                  </Button>
                ) : null}
                {safePage < totalPages ? (
                  <Button asChild variant="outline" size="sm" className="rounded-lg">
                    <Link href={`/audit-log?page=${safePage + 1}`}>Next</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{total} events</p>
          )}
        </div>
      )}
    </div>
  );
}
