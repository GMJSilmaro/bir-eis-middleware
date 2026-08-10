/** Shared seed constants — no DB access. */

import {
  FOUNDATION_PERMISSIONS,
  FOUNDATION_ROLES,
} from "../src/lib/auth/rbac-defaults";

export const DEMO_PASSWORD = "DemoPass123";

export const DEMO_USERS = [
  { email: "superadmin@demo.local", name: "Super Admin", roleSlug: "super_admin" },
  { email: "admin@demo.local", name: "Tenant Admin", roleSlug: "tenant_admin" },
  { email: "user@demo.local", name: "Member", roleSlug: "member" },
] as const;

export const PERMISSIONS = FOUNDATION_PERMISSIONS;
export const ROLES = FOUNDATION_ROLES;

export type SeedProfile = "core" | "minimal";

export function resolveSeedProfile(): SeedProfile {
  const raw = process.env.SEED_PROFILE?.trim().toLowerCase();
  if (raw === "core") return "core";
  return "minimal";
}
