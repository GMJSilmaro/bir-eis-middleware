"use server";

import { revalidatePath } from "next/cache";

import { deactivateTenantSchema } from "@/features/provider/schemas/provider.schema";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requirePlatformOperator } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export type DeactivateTenantActionState = {
  error?: string;
  success?: boolean;
};

export async function deactivateTenantAction(
  _prev: DeactivateTenantActionState,
  formData: FormData,
): Promise<DeactivateTenantActionState> {
  const session = await requirePlatformOperator();

  const parsed = deactivateTenantSchema.safeParse({
    tenantId: formData.get("tenantId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { tenantId } = parsed.data;

  if (tenantId === session.user.tenantId) {
    return { error: "You cannot deactivate your own operator workspace." };
  }

  try {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
      select: { id: true, name: true, slug: true },
    });

    if (!tenant) {
      return { error: "Tenant not found or already deactivated." };
    }

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { deletedAt: new Date() },
    });

    await writeAuditLog({
      tenantId: tenant.id,
      userId: session.user.id,
      action: "tenant.deactivated",
      entityType: "tenant",
      entityId: tenant.id,
      metadata: {
        slug: tenant.slug,
        name: tenant.name,
        deactivatedByOperatorId: session.user.id,
      },
    });

    revalidatePath("/provider");
    revalidatePath("/provider/tenants");
    revalidatePath(`/provider/tenants/${tenant.id}`);

    return { success: true };
  } catch {
    return { error: "Could not deactivate this workspace. Please try again." };
  }
}
