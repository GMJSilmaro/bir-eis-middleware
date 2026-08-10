"use server";

import { revalidatePath } from "next/cache";

import { updateOrganizationSchema } from "@/features/settings/schemas/settings.schema";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export type OrganizationActionState = {
  error?: string;
  success?: boolean;
};

export async function updateOrganizationAction(
  _prev: OrganizationActionState,
  formData: FormData,
): Promise<OrganizationActionState> {
  const session = await requirePermission("settings.manage");

  const parsed = updateOrganizationSchema.safeParse({
    name: formData.get("name"),
    tagline: formData.get("tagline") ?? "",
    logo: formData.get("logo") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, tagline, logo } = parsed.data;
  const tenantId = session.user.tenantId;

  try {
    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name,
        tagline: tagline?.trim() ? tagline.trim() : null,
        logo: logo?.trim() ? logo.trim() : null,
      },
      select: { id: true, name: true },
    });

    await writeAuditLog({
      tenantId,
      userId: session.user.id,
      action: "tenant.updated",
      entityType: "tenant",
      entityId: updated.id,
      metadata: {
        name: updated.name,
        taglineChanged: Boolean(tagline?.trim()),
        logoChanged: Boolean(logo?.trim()),
      },
    });

    revalidatePath("/settings");
    revalidatePath("/settings/organization");
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { error: "Could not save organization settings. Please try again." };
  }
}
