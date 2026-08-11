"use server";

import { revalidatePath } from "next/cache";

import { createTenantUser } from "@/features/tenants/lib/provision-tenant";
import { createUserSchema } from "@/features/users/schemas/users.schema";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export type CreateUserActionState = {
  error?: string;
  success?: boolean;
  temporaryPassword?: string;
  createdEmail?: string;
  createdName?: string;
};

export async function createUserAction(
  _prev: CreateUserActionState,
  formData: FormData,
): Promise<CreateUserActionState> {
  const session = await requirePermission("users.manage");

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, role, password } = parsed.data;
  const tenantId = session.user.tenantId;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: {
      tenantId_email: { tenantId, email: normalizedEmail },
    },
    select: { id: true, deletedAt: true },
  });

  if (existing) {
    return {
      error: existing.deletedAt
        ? "A deactivated user already uses this email. Contact support to restore them."
        : "A user with this email already exists in your organization.",
    };
  }

  try {
    const user = await createTenantUser({
      tenantId,
      name,
      email: normalizedEmail,
      password,
      roleSlug: role,
    });

    await writeAuditLog({
      tenantId,
      userId: session.user.id,
      action: "user.created",
      entityType: "user",
      entityId: user.id,
      metadata: {
        email: user.email,
        name: user.name,
        role,
      },
    });

    revalidatePath("/users");
    revalidatePath("/audit-log");

    return {
      success: true,
      temporaryPassword: password,
      createdEmail: user.email,
      createdName: user.name,
    };
  } catch {
    return { error: "Could not create user. Please try again." };
  }
}
