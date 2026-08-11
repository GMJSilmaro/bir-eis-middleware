import { ErpConnectionsForm } from "@/features/settings/components/erp-connections-form";
import { SettingsContentCard } from "@/features/settings/components/settings-content-card";
import {
  hasPermission,
  requirePermission,
} from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export const metadata = {
  title: "ERP connections · Settings · BIR EIS",
};

export default async function ErpConnectionsSettingsPage() {
  const session = await requirePermission("settings.view");
  const canManage = hasPermission(session.user.permissions, "settings.manage");

  const connections = await prisma.erpConnection.findMany({
    where: { tenantId: session.user.tenantId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      provider: true,
      name: true,
      baseUrl: true,
      username: true,
      secretLast4: true,
      enabled: true,
      lastSyncAt: true,
      notes: true,
    },
  });

  return (
    <SettingsContentCard
      title="ERP connections"
      description="Connect your ERP so you can pull invoice drafts into Outbound. Secrets are encrypted at rest and masked after save."
    >
      <ErpConnectionsForm
        canManage={canManage}
        connections={connections.map((connection) => ({
          id: connection.id,
          provider: connection.provider,
          name: connection.name,
          baseUrl: connection.baseUrl,
          username: connection.username,
          secretLast4: connection.secretLast4,
          enabled: connection.enabled,
          lastSyncAt: connection.lastSyncAt
            ? connection.lastSyncAt.toISOString()
            : null,
          notes: connection.notes,
        }))}
      />
    </SettingsContentCard>
  );
}
