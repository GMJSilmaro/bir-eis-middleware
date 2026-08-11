"use server";

import { revalidatePath } from "next/cache";

import {
  countActiveTenantAdmins,
  getTenantUserForManage,
} from "@/features/users/lib/tenant-user-guards";
import { deactivateUserSchema } from "@/features/users/schemas/users.schema";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export type DeactivateUserActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function deactivateUserAction(
  _prev: DeactivateUserActionState,
  formData: FormData,
): Promise<DeactivateUserActionState> {
  const session = await requirePermission("users.manage");

  const parsed = deactivateUserSchema.safeParse({
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { userId } = parsed.data;
  const tenantId = session.user.tenantId;

  if (userId === session.user.id) {
    return { error: "You cannot deactivate your own account." };
  }

  const target = await getTenantUserForManage(tenantId, userId);
  if (!target) {
    return { error: "User not found." };
  }

  if (target.isPlatformOperator) {
    return { error: "Platform operator accounts cannot be deactivated here." };
  }

  if (
    target.isTenantAdmin &&
    (await countActiveTenantAdmins(tenantId, { excludeUserId: userId })) === 0
  ) {
    return {
      error:
        "Cannot deactivate the last admin. Promote another user to Admin first.",
    };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    await writeAuditLog({
      tenantId,
      userId: session.user.id,
      action: "user.deactivated",
      entityType: "user",
      entityId: userId,
      metadata: {
        email: target.email,
        name: target.name,
        roles: target.roleSlugs,
      },
    });

    revalidatePath("/users");
    revalidatePath("/audit-log");

    return { success: true, message: "User deactivated." };
  } catch {
    return { error: "Could not deactivate user. Please try again." };
  }
}
