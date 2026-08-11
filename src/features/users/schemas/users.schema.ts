import { z } from "zod";

import { passwordStrengthSchema } from "@/features/settings/schemas/settings.schema";

/** Roles tenant admins may assign (never super_admin). */
export const ASSIGNABLE_TENANT_ROLES = ["tenant_admin", "member"] as const;

export type AssignableTenantRole = (typeof ASSIGNABLE_TENANT_ROLES)[number];

export const ASSIGNABLE_TENANT_ROLE_LABELS: Record<
  AssignableTenantRole,
  string
> = {
  tenant_admin: "Admin",
  member: "Member",
};

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name is too long"),
  email: z.string().trim().email("Enter a valid email").max(254),
  role: z.enum(ASSIGNABLE_TENANT_ROLES, {
    message: "Choose Admin or Member",
  }),
  password: passwordStrengthSchema,
});

export const setUserRoleSchema = z.object({
  userId: z.string().cuid("Invalid user"),
  role: z.enum(ASSIGNABLE_TENANT_ROLES, {
    message: "Choose Admin or Member",
  }),
});

export const deactivateUserSchema = z.object({
  userId: z.string().cuid("Invalid user"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type SetUserRoleInput = z.infer<typeof setUserRoleSchema>;
export type DeactivateUserInput = z.infer<typeof deactivateUserSchema>;
