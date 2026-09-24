import { z } from "zod";

import {
  CAS_STATUSES,
  CERTIFICATION_STATUSES,
  PROFILE_STATUSES,
} from "@/features/compliance/engine/types";

export const upsertTaxpayerProfileSchema = z.object({
  registeredName: z.string().trim().min(1, "Registered name is required").max(200),
  tradeName: z.string().trim().max(200).optional().or(z.literal("")),
  tin: z.string().trim().min(9, "Enter a valid TIN").max(32),
  branchCode: z.string().trim().min(1, "Branch code is required").max(16),
  officeType: z.enum(["head_office", "branch"]),
  rdoCode: z.string().trim().max(32).optional().or(z.literal("")),
  classification: z
    .enum(["large_taxpayer", "regular", "other"])
    .optional()
    .or(z.literal("")),
  vatMode: z.enum(["vat", "non_vat", "other"]),
  businessAddress: z.string().trim().max(500).optional().or(z.literal("")),
  businessType: z.string().trim().max(120).optional().or(z.literal("")),
  ecommerceEngaged: z.enum(["YES", "NO"]).optional().or(z.literal("")),
  usesCas: z.enum(["YES", "NO"]).optional().or(z.literal("")),
  contactName: z.string().trim().max(120).optional().or(z.literal("")),
  contactEmail: z.string().trim().max(200).optional().or(z.literal("")),
  contactPhone: z.string().trim().max(40).optional().or(z.literal("")),
  profileStatus: z.enum(PROFILE_STATUSES),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const upsertCasRegistrationSchema = z.object({
  id: z.string().trim().max(64).optional().or(z.literal("")),
  ackCertificateRef: z.string().trim().max(120).optional().or(z.literal("")),
  issuedAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  registeredSystem: z.string().trim().max(200).optional().or(z.literal("")),
  systemVersion: z.string().trim().max(64).optional().or(z.literal("")),
  rdoOffice: z.string().trim().max(120).optional().or(z.literal("")),
  applicability: z
    .enum(["head_office", "branch", "both"])
    .optional()
    .or(z.literal("")),
  status: z.enum(CAS_STATUSES),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const reviewCasRegistrationSchema = z.object({
  id: z.string().trim().min(1),
  status: z.enum(["UNDER_REVIEW", "REVIEWED", "REJECTED"]),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const upsertCertificationProfileSchema = z.object({
  pttNumber: z.string().trim().max(64).optional().or(z.literal("")),
  status: z.enum(CERTIFICATION_STATUSES),
  certPortalNote: z.string().trim().max(2000).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const upsertFieldMappingSchema = z.object({
  connectionId: z.string().trim().min(1),
  mappingsJson: z.string().trim().min(2, "Mappings required"),
});

export const enableProductionSchema = z.object({
  override: z.enum(["true", "false"]).default("false"),
  reason: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const ERP_SYSTEM_TYPES = [
  "cas",
  "cba",
  "pos",
  "invoicing_software",
  "custom_erp",
  "other",
] as const;

export const ERP_INTEGRATION_METHODS = [
  "rest_api",
  "database",
  "file_import",
  "webhook",
  "other",
] as const;

export const updateErpComplianceProfileSchema = z.object({
  id: z.string().trim().min(1),
  vendor: z.string().trim().max(120).optional().or(z.literal("")),
  version: z.string().trim().max(64).optional().or(z.literal("")),
  systemType: z.enum(ERP_SYSTEM_TYPES).optional().or(z.literal("")),
  integrationMethod: z
    .enum(ERP_INTEGRATION_METHODS)
    .optional()
    .or(z.literal("")),
  scope: z.enum(["head_office", "branch", "multi"]).optional().or(z.literal("")),
  environment: z.enum(["test", "prod"]).optional().or(z.literal("")),
});
