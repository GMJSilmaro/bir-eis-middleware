import { z } from "zod";

export const ERP_PROVIDERS = [
  "sap_b1",
  "acumatica",
  "erpnext",
  "other",
] as const;

export const ERP_PROVIDER_LABELS: Record<(typeof ERP_PROVIDERS)[number], string> =
  {
    sap_b1: "SAP Business One",
    acumatica: "Acumatica",
    erpnext: "ERPNext",
    other: "Other",
  };

export const upsertErpConnectionSchema = z.object({
  id: z
    .string()
    .trim()
    .max(64, "Connection id is invalid")
    .optional()
    .or(z.literal("")),
  provider: z.enum(ERP_PROVIDERS, {
    message: "Choose an ERP provider",
  }),
  name: z
    .string()
    .trim()
    .min(2, "Connection name must be at least 2 characters")
    .max(120, "Connection name is too long"),
  baseUrl: z
    .string()
    .trim()
    .max(500, "Base URL is too long")
    .optional()
    .or(z.literal("")),
  username: z
    .string()
    .trim()
    .max(200, "Username is too long")
    .optional()
    .or(z.literal("")),
  secret: z
    .string()
    .trim()
    .max(512, "Secret is too long")
    .optional()
    .or(z.literal("")),
  enabled: z.enum(["true", "false"]).default("true"),
  notes: z
    .string()
    .trim()
    .max(2000, "Notes are too long")
    .optional()
    .or(z.literal("")),
});

export const erpConnectionIdSchema = z.object({
  id: z.string().trim().min(1, "Connection id is required"),
});

export type UpsertErpConnectionInput = z.infer<typeof upsertErpConnectionSchema>;
