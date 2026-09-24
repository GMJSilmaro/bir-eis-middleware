"use server";

import { revalidatePath } from "next/cache";

import {
  defaultMappingsFromLegacyFieldMap,
  unmappedRequiredFields,
} from "@/features/compliance/lib/field-mapping-defaults";
import {
  updateErpComplianceProfileSchema,
  upsertFieldMappingSchema,
} from "@/features/compliance/schemas/compliance.schema";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

import type { ComplianceActionState } from "./taxpayer.action";

export async function updateErpComplianceProfileAction(
  _prev: ComplianceActionState,
  formData: FormData,
): Promise<ComplianceActionState> {
  const session = await requirePermission("compliance.mapping.edit");
  const tenantId = session.user.tenantId;

  const parsed = updateErpComplianceProfileSchema.safeParse({
    id: formData.get("id"),
    vendor: formData.get("vendor"),
    version: formData.get("version"),
    systemType: formData.get("systemType"),
    integrationMethod: formData.get("integrationMethod"),
    scope: formData.get("scope"),
    environment: formData.get("environment"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.erpConnection.findFirst({
    where: { id: parsed.data.id, tenantId, deletedAt: null },
  });
  if (!existing) return { error: "ERP connection not found." };

  const updated = await prisma.erpConnection.update({
    where: { id: existing.id },
    data: {
      vendor: parsed.data.vendor || null,
      version: parsed.data.version || null,
      systemType: parsed.data.systemType || null,
      integrationMethod: parsed.data.integrationMethod || null,
      scope: parsed.data.scope || null,
      environment: parsed.data.environment || "test",
    },
  });

  await writeAuditLog({
    tenantId,
    userId: session.user.id,
    action: "CONFIG_CHANGED",
    entityType: "erp_connection",
    entityId: updated.id,
    newState: {
      vendor: updated.vendor,
      version: updated.version,
      systemType: updated.systemType,
    },
  });

  revalidatePath("/compliance/erp");
  revalidatePath("/settings/integrations/erp");
  return { success: "ERP / CAS profile updated." };
}

export async function seedDefaultFieldMappingsAction(
  connectionId: string,
): Promise<ComplianceActionState> {
  const session = await requirePermission("compliance.mapping.edit");
  const tenantId = session.user.tenantId;

  const connection = await prisma.erpConnection.findFirst({
    where: { id: connectionId, tenantId, deletedAt: null },
  });
  if (!connection) return { error: "Connection not found." };

  const existingCount = await prisma.fieldMapping.count({
    where: { connectionId },
  });
  if (existingCount > 0) {
    return { error: "Mappings already exist for this connection." };
  }

  const legacy =
    connection.fieldMap && typeof connection.fieldMap === "object"
      ? (connection.fieldMap as Record<string, string>)
      : null;
  const defaults = defaultMappingsFromLegacyFieldMap(legacy);

  await prisma.fieldMapping.createMany({
    data: defaults.map((m) => ({
      tenantId,
      connectionId,
      erpField: m.erpField,
      canonicalField: m.canonicalField,
      eisField: m.eisField,
      required: m.required,
    })),
  });

  await writeAuditLog({
    tenantId,
    userId: session.user.id,
    action: "MAPPING_CHANGED",
    entityType: "field_mapping",
    entityId: connectionId,
    metadata: { count: defaults.length, seeded: true },
  });

  revalidatePath("/compliance/mapping");
  revalidatePath("/compliance/readiness");
  return { success: `Seeded ${defaults.length} default field mappings.` };
}

export async function saveFieldMappingsAction(
  _prev: ComplianceActionState,
  formData: FormData,
): Promise<ComplianceActionState> {
  const session = await requirePermission("compliance.mapping.edit");
  const tenantId = session.user.tenantId;

  const parsed = upsertFieldMappingSchema.safeParse({
    connectionId: formData.get("connectionId"),
    mappingsJson: formData.get("mappingsJson"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const connection = await prisma.erpConnection.findFirst({
    where: { id: parsed.data.connectionId, tenantId, deletedAt: null },
  });
  if (!connection) return { error: "Connection not found." };

  let rows: Array<{
    erpField: string;
    canonicalField: string;
    eisField?: string;
    required?: boolean;
  }>;
  try {
    rows = JSON.parse(parsed.data.mappingsJson) as typeof rows;
    if (!Array.isArray(rows)) throw new Error("not array");
  } catch {
    return { error: "Invalid mappings JSON." };
  }

  const erpFields = new Set<string>();
  const canonicalFields = new Set<string>();
  for (const row of rows) {
    if (!row.erpField?.trim() || !row.canonicalField?.trim()) {
      return { error: "Each mapping needs ERP and canonical fields." };
    }
    if (erpFields.has(row.erpField)) {
      return { error: `Duplicate ERP field mapping: ${row.erpField}` };
    }
    if (canonicalFields.has(row.canonicalField)) {
      return {
        error: `Duplicate canonical field mapping: ${row.canonicalField}`,
      };
    }
    erpFields.add(row.erpField);
    canonicalFields.add(row.canonicalField);
  }

  await prisma.$transaction([
    prisma.fieldMapping.deleteMany({
      where: { connectionId: connection.id, tenantId },
    }),
    prisma.fieldMapping.createMany({
      data: rows.map((m) => ({
        tenantId,
        connectionId: connection.id,
        erpField: m.erpField.trim(),
        canonicalField: m.canonicalField.trim(),
        eisField: m.eisField?.trim() || null,
        required: Boolean(m.required),
      })),
    }),
  ]);

  const missing = unmappedRequiredFields(rows);
  await writeAuditLog({
    tenantId,
    userId: session.user.id,
    action: "MAPPING_CHANGED",
    entityType: "field_mapping",
    entityId: connection.id,
    metadata: { count: rows.length, missingRequired: missing },
  });

  revalidatePath("/compliance/mapping");
  revalidatePath("/compliance/readiness");

  if (missing.length > 0) {
    return {
      success: `Saved ${rows.length} mappings. ${missing.length} required fields still unmapped — production remains blocked.`,
    };
  }
  return { success: `Saved ${rows.length} field mappings.` };
}
