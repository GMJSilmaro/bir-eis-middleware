"use server";

import { revalidatePath } from "next/cache";

import { erpConnectionIdSchema } from "@/features/settings/schemas/erp-connection.schema";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

import type { ErpConnectionActionState } from "./upsert-erp-connection.action";

export async function deleteErpConnectionAction(
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

  try {
    const existing = await prisma.erpConnection.findFirst({
      where: { id: parsed.data.id, tenantId, deletedAt: null },
      select: { id: true, name: true, provider: true },
    });

    if (!existing) {
      return { error: "ERP connection not found." };
    }

    await prisma.erpConnection.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), enabled: false },
    });

    await writeAuditLog({
      tenantId,
      userId: session.user.id,
      action: "erp_connection.deleted",
      entityType: "erp_connection",
      entityId: existing.id,
      metadata: {
        name: existing.name,
        provider: existing.provider,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/settings/integrations/erp");
    revalidatePath("/outbound/sync");
    revalidatePath("/audit-log");

    return { success: true, message: "ERP connection removed." };
  } catch {
    return { error: "Could not remove ERP connection. Please try again." };
  }
}
