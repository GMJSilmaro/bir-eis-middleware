"use server";

import bcrypt from "bcryptjs";

import { registerSchema } from "@/features/auth/schemas/auth.schema";
import { syncCredentialAccountPassword } from "@/lib/auth/auth";
import {
  FOUNDATION_PERMISSIONS,
  FOUNDATION_ROLES,
} from "@/lib/auth/rbac-defaults";
import { prisma } from "@/lib/database/client";

function slugifyOrganization(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return base || "org";
}

async function ensureUniqueTenantSlug(base: string): Promise<string> {
  let slug = base;
  let attempt = 0;

  while (true) {
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (!existing) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}

async function seedTenantRoles(tenantId: string) {
  await Promise.all(
    FOUNDATION_PERMISSIONS.map((perm) =>
      prisma.permission.upsert({
        where: { slug: perm.slug },
        create: perm,
        update: { name: perm.name },
      }),
    ),
  );

  const permissionRecords = await prisma.permission.findMany({
    where: { slug: { in: FOUNDATION_PERMISSIONS.map((p) => p.slug) } },
  });
  const permissionBySlug = Object.fromEntries(
    permissionRecords.map((p) => [p.slug, p]),
  );

  for (const roleDef of FOUNDATION_ROLES) {
    const role = await prisma.role.upsert({
      where: { tenantId_slug: { tenantId, slug: roleDef.slug } },
      create: {
        tenantId,
        slug: roleDef.slug,
        name: roleDef.name,
        description: roleDef.description,
        isSystem: true,
      },
      update: {},
    });

    const permissionIds = roleDef.permissions
      .map((slug) => permissionBySlug[slug]?.id)
      .filter((id): id is string => Boolean(id));

    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }
  }
}

export async function registerAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData,
) {
  const raw = {
    organizationName: formData.get("organizationName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { organizationName, name, email, password } = parsed.data;

  try {
    const slug = await ensureUniqueTenantSlug(slugifyOrganization(organizationName));

    const tenant = await prisma.tenant.create({
      data: {
        name: organizationName,
        slug,
        tagline: "BIR EIS workspace",
      },
    });

    await seedTenantRoles(tenant.id);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: email.toLowerCase(),
        name,
        passwordHash,
        emailVerified: true,
      },
    });

    await syncCredentialAccountPassword(user.id, passwordHash);

    const adminRole = await prisma.role.findUnique({
      where: { tenantId_slug: { tenantId: tenant.id, slug: "tenant_admin" } },
    });

    if (adminRole) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: adminRole.id },
      });
    }

    return { success: true };
  } catch {
    return { error: "Registration failed. Please try again." };
  }
}
