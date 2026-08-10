"use server";

import { revalidatePath } from "next/cache";

import { updateProfileSchema } from "@/features/settings/schemas/settings.schema";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export type ProfileActionState = {
  error?: string;
  success?: boolean;
};

export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await requirePermission("settings.view");

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    image: formData.get("image") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, image } = parsed.data;
  const userId = session.user.id;
  const tenantId = session.user.tenantId;
  const imageValue = image?.trim() ? image.trim() : null;

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        image: imageValue,
      },
      select: { id: true, name: true, image: true },
    });

    await writeAuditLog({
      tenantId,
      userId,
      action: "user.profile_updated",
      entityType: "user",
      entityId: updated.id,
      metadata: {
        name: updated.name,
        imageChanged: Boolean(updated.image),
      },
    });

    revalidatePath("/settings");
    revalidatePath("/settings/profile");
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { error: "Could not save your profile. Please try again." };
  }
}
