"use server";

import { revalidatePath } from "next/cache";

import { createTenantSchema } from "@/features/provider/schemas/provider.schema";
import { provisionTenantWithAdmin } from "@/features/tenants/lib/provision-tenant";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requirePlatformOperator } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export type CreateTenantActionState = {
  error?: string;
  success?: boolean;
  tenantId?: string;
  tenantSlug?: string;
  tenantName?: string;
  adminEmail?: string;
  /** One-time plaintext password to copy — never re-fetched. */
  oneTimePassword?: string;
  loginPath?: string;
};

export async function createTenantAction(
  _prev: CreateTenantActionState,
  formData: FormData,
): Promise<CreateTenantActionState> {
  const session = await requirePlatformOperator();

  const parsed = createTenantSchema.safeParse({
    organizationName: formData.get("organizationName"),
    adminName: formData.get("adminName"),
    adminEmail: formData.get("adminEmail"),
    password: formData.get("password"),
    tagline: formData.get("tagline") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { organizationName, adminName, adminEmail, password, tagline } =
    parsed.data;
  const email = adminEmail.toLowerCase();

  const existingUser = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true },
  });
  if (existingUser) {
    return { error: "A user with that email already exists." };
  }

  try {
    const result = await provisionTenantWithAdmin({
      organizationName,
      adminName,
      adminEmail: email,
      password,
      tagline: tagline?.trim() || undefined,
    });

    await writeAuditLog({
      tenantId: result.tenant.id,
      userId: session.user.id,
      action: "tenant.created",
      entityType: "tenant",
      entityId: result.tenant.id,
      metadata: {
        slug: result.tenant.slug,
        name: result.tenant.name,
        adminEmail: result.user.email,
        createdByOperatorId: session.user.id,
      },
    });

    revalidatePath("/provider");
    revalidatePath("/provider/tenants");

    const loginPath = `/login?tenant=${encodeURIComponent(result.tenant.slug)}`;

    return {
      success: true,
      tenantId: result.tenant.id,
      tenantSlug: result.tenant.slug,
      tenantName: result.tenant.name,
      adminEmail: result.user.email,
      oneTimePassword: password,
      loginPath,
    };
  } catch {
    return { error: "Could not create the workspace. Please try again." };
  }
}
