"use server";

import { revalidatePath } from "next/cache";

import { createOutboundDrafts } from "@/features/documents/lib/create-outbound-drafts";
import { sandboxErpPull } from "@/features/documents/lib/sandbox-erp-pull";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export type SyncErpDocumentsState = {
  error?: string;
  success?: boolean;
  message?: string;
  created?: number;
  skipped?: number;
  errors?: Array<{ row: number; message: string }>;
};

export async function syncErpDocumentsAction(
  _prev: SyncErpDocumentsState,
  formData: FormData,
): Promise<SyncErpDocumentsState> {
  const session = await requirePermission("documents.manage");
  const tenantId = session.user.tenantId;
  const connectionId = String(formData.get("connectionId") ?? "").trim();

  if (!connectionId) {
    return { error: "Choose an ERP connection to sync." };
  }

  const connection = await prisma.erpConnection.findFirst({
    where: {
      id: connectionId,
      tenantId,
      deletedAt: null,
      enabled: true,
    },
    select: {
      id: true,
      name: true,
      provider: true,
      fieldMap: true,
    },
  });

  if (!connection) {
    return {
      error:
        "Enabled ERP connection not found. Add or enable one under Settings → Integrations.",
    };
  }

  try {
    const rows = sandboxErpPull({
      connectionId: connection.id,
      fieldMap: connection.fieldMap,
    });

    const result = await createOutboundDrafts({
      tenantId,
      userId: session.user.id,
      rows,
      source: "erp_sync",
    });

    await prisma.erpConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date() },
    });

    await writeAuditLog({
      tenantId,
      userId: session.user.id,
      action: "erp_connection.synced",
      entityType: "erp_connection",
      entityId: connection.id,
      metadata: {
        name: connection.name,
        provider: connection.provider,
        created: result.created,
        skipped: result.skipped,
        errorCount: result.errors.length,
      },
    });

    revalidatePath("/outbound");
    revalidatePath("/outbound/sync");
    revalidatePath("/dashboard");
    revalidatePath("/settings/integrations/erp");
    revalidatePath("/audit-log");

    const parts = [
      result.created === 1
        ? "Created 1 draft from sandbox ERP"
        : `Created ${result.created} drafts from sandbox ERP`,
    ];
    if (result.skipped > 0) {
      parts.push(
        result.skipped === 1
          ? "skipped 1 duplicate"
          : `skipped ${result.skipped} duplicates`,
      );
    }

    return {
      success: true,
      created: result.created,
      skipped: result.skipped,
      errors: result.errors,
      message: `${parts.join(", ")}.`,
    };
  } catch {
    return { error: "Could not sync ERP documents. Please try again." };
  }
}
