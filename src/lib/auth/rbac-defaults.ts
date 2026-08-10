/** Shared RBAC defaults for seed and tenant registration. */

export const FOUNDATION_PERMISSIONS = [
  { slug: "dashboard.view", name: "View dashboard" },
  { slug: "settings.view", name: "View settings" },
  { slug: "settings.manage", name: "Manage settings" },
  { slug: "users.manage", name: "Manage users" },
  { slug: "audit.view", name: "View audit logs" },
] as const;

export const FOUNDATION_ROLES = [
  {
    slug: "super_admin",
    name: "Super Admin",
    description: "Platform operator",
    permissions: FOUNDATION_PERMISSIONS.map((p) => p.slug),
  },
  {
    slug: "tenant_admin",
    name: "Tenant Admin",
    description: "Tenant administrator",
    permissions: [
      "dashboard.view",
      "settings.view",
      "settings.manage",
      "users.manage",
      "audit.view",
    ] as const,
  },
  {
    slug: "member",
    name: "Member",
    description: "Standard tenant member",
    permissions: ["dashboard.view", "settings.view"] as const,
  },
] as const;
