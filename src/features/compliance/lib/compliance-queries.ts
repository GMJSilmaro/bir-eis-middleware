import { prisma } from "@/lib/database/client";
import type { Prisma } from "@/lib/database/generated/prisma/client";

import { runCompliance } from "@/features/compliance/engine/run-compliance";
import type {
  ComplianceRunSummary,
  InvoiceContext,
  ValidationScope,
} from "@/features/compliance/engine/types";
import { REQUIRED_CANONICAL_FIELDS } from "@/features/compliance/lib/field-mapping-defaults";

export async function loadComplianceContexts(tenantId: string) {
  const [taxpayer, cas, mappings, activation, certification, auditCount] =
    await Promise.all([
      prisma.taxpayerProfile.findUnique({ where: { tenantId } }),
      prisma.casRegistration.findFirst({
        where: { tenantId },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.fieldMapping.findMany({
        where: { tenantId },
        select: {
          erpField: true,
          canonicalField: true,
          eisField: true,
          required: true,
        },
      }),
      prisma.complianceActivation.findUnique({ where: { tenantId } }),
      prisma.certificationProfile.findUnique({ where: { tenantId } }),
      prisma.auditLog.count({ where: { tenantId } }),
    ]);

  const erp = await prisma.erpConnection.findFirst({
    where: { tenantId, deletedAt: null, enabled: true },
    orderBy: { updatedAt: "desc" },
  });

  return {
    taxpayer,
    cas,
    mappings,
    activation,
    certification,
    erp,
    hasAuditTrail: auditCount > 0,
  };
}

export async function ensureComplianceActivation(tenantId: string) {
  return prisma.complianceActivation.upsert({
    where: { tenantId },
    create: { tenantId, gateState: "DRAFT" },
    update: {},
  });
}

export async function ensureCertificationProfile(tenantId: string) {
  return prisma.certificationProfile.upsert({
    where: { tenantId },
    create: { tenantId, status: "NOT_RECORDED" },
    update: {},
  });
}

export async function ensureTaxpayerProfile(tenantId: string) {
  return prisma.taxpayerProfile.upsert({
    where: { tenantId },
    create: { tenantId, profileStatus: "NOT_PROVIDED" },
    update: {},
  });
}

export function buildInvoiceContextFromDoc(params: {
  documentNumber: string;
  issueDate: Date | string;
  documentType: string;
  currency: string;
  sourceErpId?: string | null;
  counterpartName: string;
  counterpartTin?: string | null;
  lineExtensionAmount: string | number;
  taxAmount: string | number;
  totalAmount: string | number;
  sellerTin?: string | null;
  sellerRegisteredName?: string | null;
  sellerBranchCode?: string | null;
  vatMode?: string | null;
  isDuplicateNumber?: boolean;
}): InvoiceContext {
  return { ...params };
}

export async function persistValidationRun(params: {
  tenantId: string;
  scope: ValidationScope;
  summary: ComplianceRunSummary;
  entityType?: string;
  entityId?: string;
  createdById?: string | null;
}) {
  return prisma.complianceValidationRun.create({
    data: {
      tenantId: params.tenantId,
      scope: params.scope,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
      ruleVersion: params.summary.ruleVersion,
      overallOutcome: params.summary.overallOutcome,
      blockingFailureCount: params.summary.blockingFailureCount,
      createdById: params.createdById ?? null,
      results: {
        create: params.summary.results.map((r) => ({
          ruleCode: r.ruleCode,
          category: r.category,
          outcome: r.outcome,
          message: r.message,
          expected: r.expected ?? null,
          actual: r.actual ?? null,
          severity: r.severity,
          blocking: r.blocking,
          source: r.source ?? null,
          regulatoryReference: r.regulatoryReference ?? null,
        })),
      },
    },
    include: { results: true },
  });
}

export async function appendPayloadVersion(params: {
  tenantId: string;
  invoiceDocumentId: string;
  kind:
    | "ORIGINAL_ERP"
    | "CANONICAL"
    | "EIS_DRAFT"
    | "EIS_SIGNED"
    | "BIR_RESPONSE"
    | "VALIDATION_RESULT";
  payload: Prisma.InputJsonValue;
}) {
  return prisma.documentPayloadVersion.create({
    data: {
      tenantId: params.tenantId,
      invoiceDocumentId: params.invoiceDocumentId,
      kind: params.kind,
      payload: params.payload,
    },
  });
}

export async function runAndPersistTenantValidation(params: {
  tenantId: string;
  scope: ValidationScope;
  invoice?: InvoiceContext | null;
  entityType?: string;
  entityId?: string;
  createdById?: string | null;
}) {
  const ctx = await loadComplianceContexts(params.tenantId);
  const summary = runCompliance(params.scope, {
    taxpayer: ctx.taxpayer,
    cas: ctx.cas,
    mappings: ctx.mappings,
    requiredCanonicalFields: [...REQUIRED_CANONICAL_FIELDS],
    invoice: params.invoice ?? null,
    hasAuditTrail: ctx.hasAuditTrail,
    productionEnabled: ctx.activation?.productionEnabled ?? false,
  });

  const run = await persistValidationRun({
    tenantId: params.tenantId,
    scope: params.scope,
    summary,
    entityType: params.entityType,
    entityId: params.entityId,
    createdById: params.createdById,
  });

  return { summary, run, ctx };
}
