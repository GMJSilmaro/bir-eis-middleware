"use server";

import { revalidatePath } from "next/cache";

import { upsertEisCredentialsSchema } from "@/features/settings/schemas/settings.schema";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requirePermission } from "@/lib/auth/permissions";
import {
  encryptSecret,
  maskSecretLast4,
} from "@/lib/crypto/credentials-encryption";
import { prisma } from "@/lib/database/client";

export type EisCredentialsActionState = {
  error?: string;
  success?: boolean;
};

export async function upsertEisCredentialsAction(
  _prev: EisCredentialsActionState,
  formData: FormData,
): Promise<EisCredentialsActionState> {
  const session = await requirePermission("settings.manage");

  const parsed = upsertEisCredentialsSchema.safeParse({
    tin: formData.get("tin"),
    environment: formData.get("environment"),
    pttNumber: formData.get("pttNumber") ?? "",
    pttStatus: formData.get("pttStatus"),
    apiKey: formData.get("apiKey") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { tin, environment, pttNumber, pttStatus, apiKey, notes } = parsed.data;
  const tenantId = session.user.tenantId;
  const apiKeyTrimmed = apiKey?.trim() ?? "";

  try {
    const existing = await prisma.eisCredential.findUnique({
      where: { tenantId },
      select: {
        id: true,
        apiKeyCiphertext: true,
        apiKeyLast4: true,
      },
    });

    let apiKeyCiphertext = existing?.apiKeyCiphertext ?? null;
    let apiKeyLast4 = existing?.apiKeyLast4 ?? null;
    let apiKeyReplaced = false;

    if (apiKeyTrimmed) {
      if (!process.env.CREDENTIALS_ENCRYPTION_KEY?.trim()) {
        return {
          error:
            "Credential encryption is not configured. Set CREDENTIALS_ENCRYPTION_KEY and try again.",
        };
      }
      apiKeyCiphertext = encryptSecret(apiKeyTrimmed);
      apiKeyLast4 = maskSecretLast4(apiKeyTrimmed);
      apiKeyReplaced = true;
    }

    const credential = await prisma.eisCredential.upsert({
      where: { tenantId },
      create: {
        tenantId,
        tin,
        environment,
        pttNumber: pttNumber?.trim() ? pttNumber.trim() : null,
        pttStatus,
        apiKeyCiphertext,
        apiKeyLast4,
        notes: notes?.trim() ? notes.trim() : null,
      },
      update: {
        tin,
        environment,
        pttNumber: pttNumber?.trim() ? pttNumber.trim() : null,
        pttStatus,
        apiKeyCiphertext,
        apiKeyLast4,
        notes: notes?.trim() ? notes.trim() : null,
        deletedAt: null,
      },
      select: { id: true, tin: true, environment: true, pttStatus: true },
    });

    await writeAuditLog({
      tenantId,
      userId: session.user.id,
      action: "eis_credential.upserted",
      entityType: "eis_credential",
      entityId: credential.id,
      metadata: {
        tin: credential.tin,
        environment: credential.environment,
        pttStatus: credential.pttStatus,
        apiKeyUpdated: apiKeyReplaced,
        apiKeyLast4: apiKeyLast4 ?? undefined,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/settings/eis-credentials");
    revalidatePath("/audit-log");
    return { success: true };
  } catch {
    return {
      error: "Could not save EIS credentials. Please try again.",
    };
  }
}
