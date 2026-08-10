"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { changePasswordSchema } from "@/features/settings/schemas/settings.schema";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { syncCredentialAccountPassword } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export type ChangePasswordActionState = {
  error?: string;
  success?: boolean;
};

export async function changePasswordAction(
  _prev: ChangePasswordActionState,
  formData: FormData,
): Promise<ChangePasswordActionState> {
  const session = await requirePermission("settings.view");

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { currentPassword, newPassword } = parsed.data;
  const userId = session.user.id;
  const tenantId = session.user.tenantId;

  try {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return { error: "Account not found." };
    }

    const currentMatches = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!currentMatches) {
      return { error: "Current password is incorrect." };
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    await syncCredentialAccountPassword(userId, passwordHash);

    await writeAuditLog({
      tenantId,
      userId,
      action: "user.password_changed",
      entityType: "user",
      entityId: userId,
      metadata: {},
    });

    revalidatePath("/settings/password");
    return { success: true };
  } catch {
    return { error: "Could not update your password. Please try again." };
  }
}
