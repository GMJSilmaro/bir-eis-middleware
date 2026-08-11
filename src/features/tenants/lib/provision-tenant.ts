import bcrypt from "bcryptjs";

import { syncCredentialAccountPassword } from "@/lib/auth/auth";
import {
  FOUNDATION_PERMISSIONS,
  FOUNDATION_ROLES,
} from "@/lib/auth/rbac-defaults";
import { prisma } from "@/lib/database/client";

/** Roles seeded for every new tenant workspace (never includes super_admin). */
const TENANT_ROLE_SLUGS = ["tenant_admin", "member"] as const;

export type TenantRoleSlug = (typeof TENANT_ROLE_SLUGS)[number];

export type ProvisionTenantWithAdminInput = {
  organizationName: string;
  adminName: string;
  adminEmail: string;
  password: string;
  tagline?: string;
};

export type ProvisionTenantWithAdminResult = {
  tenant: { id: string; name: string; slug: string };
  user: { id: string; email: string; name: string };
};

export type CreateTenantUserInput = {
  tenantId: string;
  name: string;
  email: string;
  password: string;
  roleSlug: TenantRoleSlug;
};

export function slugifyOrganization(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return base || "org";
}

export async function ensureUniqueTenantSlug(base: string): Promise<string> {
  let slug = base;
  let attempt = 0;

  while (true) {
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (!existing) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}

/**
 * Upserts foundation permissions and tenant-scoped roles.
 * Does not create `super_admin` — that role stays on the demo/platform tenant via seed.
 */
export async function seedTenantRoles(tenantId: string): Promise<void> {
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

  const tenantRoles = FOUNDATION_ROLES.filter((roleDef) =>
    (TENANT_ROLE_SLUGS as readonly string[]).includes(roleDef.slug),
  );

  for (const roleDef of tenantRoles) {
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

export async function createTenantUser(
  input: CreateTenantUserInput,
): Promise<{ id: string; email: string; name: string }> {
  if (!(TENANT_ROLE_SLUGS as readonly string[]).includes(input.roleSlug)) {
    throw new Error("Invalid role for tenant user");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const email = input.email.toLowerCase();

  const user = await prisma.user.create({
    data: {
      tenantId: input.tenantId,
      email,
      name: input.name,
      passwordHash,
      emailVerified: true,
    },
  });

  await syncCredentialAccountPassword(user.id, passwordHash);

  const role = await prisma.role.findUnique({
    where: {
      tenantId_slug: { tenantId: input.tenantId, slug: input.roleSlug },
    },
  });

  if (!role) {
    throw new Error(`Role "${input.roleSlug}" not found for tenant`);
  }

  await prisma.userRole.create({
    data: { userId: user.id, roleId: role.id },
  });

  return { id: user.id, email: user.email, name: user.name };
}

/** Create a tenant workspace, seed RBAC, and attach the first tenant_admin. */
export async function provisionTenantWithAdmin(
  input: ProvisionTenantWithAdminInput,
): Promise<ProvisionTenantWithAdminResult> {
  const slug = await ensureUniqueTenantSlug(
    slugifyOrganization(input.organizationName),
  );

  const tenant = await prisma.tenant.create({
    data: {
      name: input.organizationName,
      slug,
      tagline: input.tagline ?? "BIR EIS workspace",
    },
  });

  await seedTenantRoles(tenant.id);

  const user = await createTenantUser({
    tenantId: tenant.id,
    name: input.adminName,
    email: input.adminEmail,
    password: input.password,
    roleSlug: "tenant_admin",
  });

  return {
    tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    user,
  };
}
