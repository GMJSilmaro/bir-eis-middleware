"use server";

import { erpConnectionIdSchema } from "@/features/settings/schemas/erp-connection.schema";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

import type { ErpConnectionActionState } from "./upsert-erp-connection.action";

/**
 * Sandbox connectivity check — no live ERP HTTP.
 */
export async function testErpConnectionAction(
  _prev: ErpConnectionActionState,
  formData: FormData,
): Promise<ErpConnectionActionState> {
  const session = await requirePermission("settings.manage");

  const parsed = erpConnectionIdSchema.safeParse({
    id: formData.get("id"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid connection" };
  }

  const tenantId = session.user.tenantId;
  const connection = await prisma.erpConnection.findFirst({
    where: { id: parsed.data.id, tenantId, deletedAt: null },
    select: { id: true, name: true, provider: true, enabled: true },
  });

  if (!connection) {
    return { error: "ERP connection not found." };
  }

  if (!connection.enabled) {
    return {
      error: "Enable this connection before testing.",
    };
  }

  await writeAuditLog({
    tenantId,
    userId: session.user.id,
    action: "erp_connection.tested",
    entityType: "erp_connection",
    entityId: connection.id,
    metadata: {
      name: connection.name,
      provider: connection.provider,
      result: "sandbox_ok",
    },
  });

  return {
    success: true,
    message: `Sandbox check passed for “${connection.name}”. Live ERP HTTP is not used yet.`,
  };
}
