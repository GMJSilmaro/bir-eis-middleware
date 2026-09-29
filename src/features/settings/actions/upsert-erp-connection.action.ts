"use server";

import { revalidatePath } from "next/cache";

import { invalidateDownstreamReadiness } from "@/features/bir-setup/lib/invalidate-downstream";
import { DEFAULT_ERP_FIELD_MAP } from "@/features/documents/lib/bir-portal-field-map";
import { upsertErpConnectionSchema } from "@/features/settings/schemas/erp-connection.schema";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requirePermission } from "@/lib/auth/permissions";
import {
  encryptSecret,
  maskSecretLast4,
} from "@/lib/crypto/credentials-encryption";
import { prisma } from "@/lib/database/client";
import type { Prisma } from "@/lib/database/generated/prisma/client";

export type ErpConnectionActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function upsertErpConnectionAction(
  _prev: ErpConnectionActionState,
  formData: FormData,
): Promise<ErpConnectionActionState> {
  const session = await requirePermission("settings.manage");

  const parsed = upsertErpConnectionSchema.safeParse({
    id: formData.get("id") ?? "",
    provider: formData.get("provider"),
    name: formData.get("name"),
    baseUrl: formData.get("baseUrl") ?? "",
    username: formData.get("username") ?? "",
    secret: formData.get("secret") ?? "",
    enabled: formData.get("enabled") ?? "true",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { id, provider, name, baseUrl, username, secret, enabled, notes } =
    parsed.data;
  const tenantId = session.user.tenantId;
  const secretTrimmed = secret?.trim() ?? "";
  const connectionId = id?.trim() || null;

  try {
    const existing = connectionId
      ? await prisma.erpConnection.findFirst({
          where: { id: connectionId, tenantId, deletedAt: null },
          select: {
            id: true,
            secretCiphertext: true,
            secretLast4: true,
            fieldMap: true,
          },
        })
      : null;

    if (connectionId && !existing) {
      return { error: "ERP connection not found." };
    }

    let secretCiphertext = existing?.secretCiphertext ?? null;
    let secretLast4 = existing?.secretLast4 ?? null;
    let secretReplaced = false;

    if (secretTrimmed) {
      if (!process.env.CREDENTIALS_ENCRYPTION_KEY?.trim()) {
        return {
          error:
            "Credential encryption is not configured. Set CREDENTIALS_ENCRYPTION_KEY and try again.",
        };
      }
      secretCiphertext = encryptSecret(secretTrimmed);
      secretLast4 = maskSecretLast4(secretTrimmed);
      secretReplaced = true;
    }

    const fieldMapJson = (existing?.fieldMap ??
      DEFAULT_ERP_FIELD_MAP) as Prisma.InputJsonValue;

    const connection = existing
      ? await prisma.erpConnection.update({
          where: { id: existing.id },
          data: {
            provider,
            name,
            baseUrl: baseUrl?.trim() ? baseUrl.trim() : null,
            username: username?.trim() ? username.trim() : null,
            secretCiphertext,
            secretLast4,
            enabled: enabled === "true",
            notes: notes?.trim() ? notes.trim() : null,
            deletedAt: null,
          },
          select: { id: true, name: true, provider: true, enabled: true },
        })
      : await prisma.erpConnection.create({
          data: {
            tenantId,
            provider,
            name,
            baseUrl: baseUrl?.trim() ? baseUrl.trim() : null,
            username: username?.trim() ? username.trim() : null,
            secretCiphertext,
            secretLast4,
            fieldMap: fieldMapJson,
            enabled: enabled === "true",
            notes: notes?.trim() ? notes.trim() : null,
          },
          select: { id: true, name: true, provider: true, enabled: true },
        });

    await writeAuditLog({
      tenantId,
      userId: session.user.id,
      action: existing
        ? "erp_connection.updated"
        : "erp_connection.created",
      entityType: "erp_connection",
      entityId: connection.id,
      metadata: {
        name: connection.name,
        provider: connection.provider,
        enabled: connection.enabled,
        secretUpdated: secretReplaced,
        secretLast4: secretLast4 ?? undefined,
      },
    });

    if (existing) {
      await invalidateDownstreamReadiness({
        tenantId,
        userId: session.user.id,
        reason:
          "ERP connection changed. Data discovery, mapping, validation, test transmission, and reconciliation need to be re-checked.",
      });
    }

    revalidatePath("/settings");
    revalidatePath("/settings/integrations/erp");
    revalidatePath("/settings/bir-eis-setup");
    revalidatePath("/dashboard");
    revalidatePath("/outbound/sync");
    revalidatePath("/audit-log");

    return {
      success: true,
      message: existing ? "ERP connection updated." : "ERP connection saved.",
    };
  } catch {
    return {
      error: "Could not save ERP connection. Please try again.",
    };
  }
}
