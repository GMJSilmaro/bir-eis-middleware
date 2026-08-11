"use server";

import { revalidatePath } from "next/cache";

import { updatePlatformBrandingSchema } from "@/features/provider/schemas/provider.schema";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requirePlatformOperator } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export type PlatformBrandingActionState = {
  error?: string;
  success?: boolean;
};

export async function updatePlatformBrandingAction(
  _prev: PlatformBrandingActionState,
  formData: FormData,
): Promise<PlatformBrandingActionState> {
  const session = await requirePlatformOperator();

  const parsed = updatePlatformBrandingSchema.safeParse({
    productName: formData.get("productName"),
    productTagline: formData.get("productTagline"),
    logo: formData.get("logo") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { productName, productTagline, logo } = parsed.data;

  try {
    const updated = await prisma.platformSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        productName,
        productTagline,
        logo: logo?.trim() ? logo.trim() : null,
      },
      update: {
        productName,
        productTagline,
        logo: logo?.trim() ? logo.trim() : null,
      },
      select: { id: true, productName: true },
    });

    await writeAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "platform_settings.updated",
      entityType: "platform_settings",
      entityId: updated.id,
      metadata: {
        productName: updated.productName,
        taglineChanged: Boolean(productTagline.trim()),
        logoChanged: Boolean(logo?.trim()),
      },
    });

    revalidatePath("/provider/branding");
    revalidatePath("/login");
    revalidatePath("/", "layout");

    return { success: true };
  } catch {
    return { error: "Could not save platform branding. Please try again." };
  }
}
