import { SettingsContentCard } from "@/features/settings/components/settings-content-card";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

const COMPLIANCE_ACTIONS = [
  "CONFIG_CHANGED",
  "MAPPING_CHANGED",
  "DOCUMENT_UPLOADED",
  "DOCUMENT_REVIEWED",
  "VALIDATION_RUN",
  "VALIDATION_FAILED",
  "SUBMISSION_STARTED",
  "SUBMISSION_SUCCEEDED",
  "SUBMISSION_FAILED",
  "RETRY_REQUESTED",
  "STATUS_CHANGED",
  "CANCELLATION_REQUESTED",
  "CORRECTION_CREATED",
  "document.queued",
  "document.cancellation_requested",
  "document.cancellation_submitted",
  "document.cancellation_accepted",
  "document.cancellation_rejected",
  "eis_credential.upserted",
];

export default async function ComplianceAuditPage() {
  const session = await requirePermission("compliance.view");
  // Also require audit.view when present; compliance.view is enough for filtered trail
  const logs = await prisma.auditLog.findMany({
    where: {
      tenantId: session.user.tenantId,
      action: { in: COMPLIANCE_ACTIONS },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <SettingsContentCard
      title="Compliance audit trail"
      description="Append-only history of compliance-sensitive actions. Entries cannot be deleted from this portal."
    >
      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No compliance audit events yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-2 font-medium">When</th>
                <th className="py-2 pr-2 font-medium">Actor</th>
                <th className="py-2 pr-2 font-medium">Action</th>
                <th className="py-2 pr-2 font-medium">Entity</th>
                <th className="py-2 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border/60 align-top">
                  <td className="py-2 pr-2 whitespace-nowrap text-xs">
                    {log.createdAt.toISOString()}
                  </td>
                  <td className="py-2 pr-2">
                    {log.user?.name || log.user?.email || "—"}
                  </td>
                  <td className="py-2 pr-2 font-mono text-xs">{log.action}</td>
                  <td className="py-2 pr-2 text-xs">
                    {log.entityType}
                    {log.entityId ? ` · ${log.entityId.slice(0, 8)}…` : ""}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {log.reason ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SettingsContentCard>
  );
}
