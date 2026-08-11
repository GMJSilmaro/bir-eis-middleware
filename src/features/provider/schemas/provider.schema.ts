import { z } from "zod";

import { passwordStrengthSchema } from "@/features/settings/schemas/settings.schema";

export const createTenantSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters")
    .max(120, "Organization name is too long"),
  adminName: z
    .string()
    .trim()
    .min(2, "Admin name must be at least 2 characters")
    .max(120, "Admin name is too long"),
  adminEmail: z.string().trim().email("Enter a valid admin email"),
  password: passwordStrengthSchema,
  tagline: z
    .string()
    .trim()
    .max(200, "Tagline is too long")
    .optional()
    .or(z.literal("")),
});

export const updatePlatformBrandingSchema = z.object({
  productName: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(120, "Product name is too long"),
  productTagline: z
    .string()
    .trim()
    .min(2, "Tagline must be at least 2 characters")
    .max(200, "Tagline is too long"),
  logo: z
    .string()
    .trim()
    .max(500_000, "Logo value is too large")
    .optional()
    .or(z.literal("")),
});

export const deactivateTenantSchema = z.object({
  tenantId: z.string().trim().min(1, "Invalid tenant"),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdatePlatformBrandingInput = z.infer<
  typeof updatePlatformBrandingSchema
>;
