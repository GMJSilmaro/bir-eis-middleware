import { PLATFORM_OPERATOR_ROLE_SLUGS } from "@/lib/auth/role-constants";
import { prisma } from "@/lib/database/client";

/** Active users in the tenant who hold the tenant_admin role. */
export async function countActiveTenantAdmins(
  tenantId: string,
  options?: { excludeUserId?: string },
): Promise<number> {
  return prisma.user.count({
    where: {
      tenantId,
      deletedAt: null,
      ...(options?.excludeUserId
        ? { id: { not: options.excludeUserId } }
        : {}),
      userRoles: {
        some: {
          role: {
            slug: "tenant_admin",
            deletedAt: null,
          },
        },
      },
    },
  });
}

export async function getTenantUserForManage(
  tenantId: string,
  userId: string,
): Promise<{
  id: string;
  email: string;
  name: string;
  roleSlugs: string[];
  isTenantAdmin: boolean;
  isPlatformOperator: boolean;
} | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      userRoles: {
        select: { role: { select: { slug: true, deletedAt: true } } },
      },
    },
  });

  if (!user) return null;

  const roleSlugs = user.userRoles
    .filter((ur) => ur.role.deletedAt == null)
    .map((ur) => ur.role.slug);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roleSlugs,
    isTenantAdmin: roleSlugs.includes("tenant_admin"),
    isPlatformOperator: roleSlugs.some((slug) =>
      PLATFORM_OPERATOR_ROLE_SLUGS.has(slug),
    ),
  };
}
