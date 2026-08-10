import { z } from "zod";

export const EIS_ENVIRONMENTS = ["cert", "prod"] as const;
export const PTT_STATUSES = [
  "not_started",
  "pending",
  "active",
  "expired",
] as const;

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(120, "Company name is too long"),
  tagline: z
    .string()
    .trim()
    .max(200, "Tagline is too long")
    .optional()
    .or(z.literal("")),
  logo: z
    .string()
    .trim()
    .max(500_000, "Logo value is too large")
    .optional()
    .or(z.literal("")),
});

export const upsertEisCredentialsSchema = z.object({
  tin: z
    .string()
    .trim()
    .min(9, "Enter a valid TIN")
    .max(32, "TIN is too long"),
  environment: z.enum(EIS_ENVIRONMENTS, {
    message: "Choose Cert or Production",
  }),
  pttNumber: z
    .string()
    .trim()
    .max(64, "PTT number is too long")
    .optional()
    .or(z.literal("")),
  pttStatus: z.enum(PTT_STATUSES, {
    message: "Choose a valid PTT status",
  }),
  apiKey: z
    .string()
    .trim()
    .max(512, "API key is too long")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(2000, "Notes are too long")
    .optional()
    .or(z.literal("")),
});

/** Shared strong-password rules for account change-password. */
export const passwordStrengthSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain a special character");

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name is too long"),
  image: z
    .string()
    .trim()
    .max(500_000, "Profile photo is too large")
    .optional()
    .or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordStrengthSchema,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"],
  });

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type UpsertEisCredentialsInput = z.infer<
  typeof upsertEisCredentialsSchema
>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const EIS_ENVIRONMENT_LABELS: Record<
  (typeof EIS_ENVIRONMENTS)[number],
  string
> = {
  cert: "Certification (sandbox)",
  prod: "Production",
};

export const PTT_STATUS_LABELS: Record<(typeof PTT_STATUSES)[number], string> =
  {
    not_started: "Not started",
    pending: "Pending",
    active: "Active",
    expired: "Expired",
  };
