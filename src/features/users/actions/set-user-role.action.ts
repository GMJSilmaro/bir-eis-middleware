"use server";

import { revalidatePath } from "next/cache";

import {
  countActiveTenantAdmins,
  getTenantUserForManage,
} from "@/features/users/lib/tenant-user-guards";
import { setUserRoleSchema } from "@/features/users/schemas/users.schema";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export type SetUserRoleActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function setUserRoleAction(
  _prev: SetUserRoleActionState,
  formData: FormData,
): Promise<SetUserRoleActionState> {
  const session = await requirePermission("users.manage");

  const parsed = setUserRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { userId, role } = parsed.data;
  const tenantId = session.user.tenantId;

  const target = await getTenantUserForManage(tenantId, userId);
  if (!target) {
    return { error: "User not found." };
  }

  if (target.isPlatformOperator) {
    return { error: "Platform operator accounts cannot be changed here." };
  }

  if (target.roleSlugs.includes(role) && target.roleSlugs.length === 1) {
    return { success: true, message: "Role is already set." };
  }

  if (
    target.isTenantAdmin &&
    role === "member" &&
    (await countActiveTenantAdmins(tenantId, { excludeUserId: userId })) === 0
  ) {
    return {
      error:
        "Cannot demote the last admin. Promote another user to Admin first.",
    };
  }

  const newRole = await prisma.role.findUnique({
    where: { tenantId_slug: { tenantId, slug: role } },
    select: { id: true, slug: true },
  });

  if (!newRole) {
    return { error: "Role is not available for this organization." };
  }

  const assignableRoles = await prisma.role.findMany({
    where: {
      tenantId,
      slug: { in: ["tenant_admin", "member"] },
      deletedAt: null,
    },
    select: { id: true },
  });
  const assignableRoleIds = assignableRoles.map((r) => r.id);

  try {
    await prisma.$transaction(async (tx) => {
      if (assignableRoleIds.length > 0) {
        await tx.userRole.deleteMany({
          where: {
            userId,
            roleId: { in: assignableRoleIds },
          },
        });
      }

      await tx.userRole.create({
        data: { userId, roleId: newRole.id },
      });
    });

    await writeAuditLog({
      tenantId,
      userId: session.user.id,
      action: "user.role_updated",
      entityType: "user",
      entityId: userId,
      metadata: {
        email: target.email,
        previousRoles: target.roleSlugs,
        role: newRole.slug,
      },
    });

    revalidatePath("/users");
    revalidatePath("/audit-log");

    return { success: true, message: "Role updated." };
  } catch {
    return { error: "Could not update role. Please try again." };
  }
}
