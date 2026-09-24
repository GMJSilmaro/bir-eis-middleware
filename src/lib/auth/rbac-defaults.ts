/** Shared RBAC defaults for seed and tenant registration. */

export const FOUNDATION_PERMISSIONS = [
  { slug: "dashboard.view", name: "View dashboard" },
  { slug: "settings.view", name: "View settings" },
  { slug: "settings.manage", name: "Manage settings" },
  { slug: "users.manage", name: "Manage users" },
  { slug: "audit.view", name: "View audit logs" },
  { slug: "documents.view", name: "View documents" },
  { slug: "documents.manage", name: "Manage documents" },
  { slug: "compliance.view", name: "View compliance" },
  { slug: "compliance.taxpayer.edit", name: "Edit taxpayer profile" },
  { slug: "compliance.mapping.edit", name: "Edit ERP field mapping" },
  { slug: "compliance.cas.review", name: "Review CAS documents" },
  { slug: "compliance.validation.run", name: "Run compliance validation" },
  { slug: "compliance.submit", name: "Submit to EIS" },
  { slug: "compliance.retry", name: "Retry EIS transmission" },
  { slug: "compliance.cancellation.request", name: "Request invoice cancellation" },
  { slug: "compliance.certification.manage", name: "Manage certification / PTT record" },
  { slug: "compliance.production.enable", name: "Enable production transmission" },
] as const;

const ALL_PERMISSION_SLUGS = FOUNDATION_PERMISSIONS.map((p) => p.slug);

const ADMIN_COMPLIANCE = [
  "compliance.view",
  "compliance.taxpayer.edit",
  "compliance.mapping.edit",
  "compliance.cas.review",
  "compliance.validation.run",
  "compliance.submit",
  "compliance.retry",
  "compliance.cancellation.request",
  "compliance.certification.manage",
  "compliance.production.enable",
] as const;

export const FOUNDATION_ROLES = [
  {
    slug: "super_admin",
    name: "Super Admin",
    description: "Platform operator",
    permissions: ALL_PERMISSION_SLUGS,
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
      "documents.view",
      "documents.manage",
      ...ADMIN_COMPLIANCE,
    ] as const,
  },
  {
    slug: "member",
    name: "Member",
    description: "Standard tenant member",
    permissions: [
      "dashboard.view",
      "settings.view",
      "documents.view",
      "compliance.view",
    ] as const,
  },
] as const;
