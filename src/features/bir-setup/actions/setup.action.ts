"use server";

import { revalidatePath } from "next/cache";

import {
  isBirSetupStepKey,
  type BirSetupStepKey,
} from "@/features/bir-setup/lib/step-definitions";
import { ensureEisSetupState } from "@/features/bir-setup/lib/get-eis-setup-readiness";
import {
  discoverFieldsFromSamples,
  parseCsvSamples,
  parseJsonSamples,
  parseXmlSamples,
  runDataQualityScan,
} from "@/features/bir-setup/lib/data-discovery";
import { clearRevalidationFlag } from "@/features/bir-setup/lib/invalidate-downstream";
import { sandboxErpRawSamples } from "@/features/documents/lib/sandbox-erp-pull";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export type BirSetupActionState = {
  error?: string;
  success?: string;
};

function revalidateSetupPaths() {
  revalidatePath("/settings/bir-eis-setup");
  revalidatePath("/dashboard");
  revalidatePath("/compliance");
  revalidatePath("/compliance/readiness");
}

export async function startOrResumeSetupAction(): Promise<BirSetupActionState> {
  const session = await requirePermission("compliance.view");
  const tenantId = session.user.tenantId;
  const setup = await ensureEisSetupState(tenantId);

  await prisma.eisSetupState.update({
    where: { id: setup.id },
    data: {
      wizardStartedAt: setup.wizardStartedAt ?? new Date(),
    },
  });

  await writeAuditLog({
    tenantId,
    userId: session.user.id,
    action: "READINESS_CHANGED",
    entityType: "eis_setup_state",
    entityId: setup.id,
    reason: "BIR EIS setup wizard started or resumed",
  });

  revalidateSetupPaths();
  return { success: "Setup progress saved." };
}

export async function setWizardStepAction(
  stepKey: string,
): Promise<BirSetupActionState> {
  const session = await requirePermission("compliance.view");
  if (!isBirSetupStepKey(stepKey)) {
    return { error: "Unknown setup step" };
  }

  const tenantId = session.user.tenantId;
  const setup = await ensureEisSetupState(tenantId);
  await prisma.eisSetupState.update({
    where: { id: setup.id },
    data: {
      currentStepKey: stepKey,
      wizardStartedAt: setup.wizardStartedAt ?? new Date(),
    },
  });

  revalidateSetupPaths();
  return { success: "Step saved." };
}

export async function dismissSetupReminderAction(): Promise<BirSetupActionState> {
  const session = await requirePermission("compliance.view");
  const tenantId = session.user.tenantId;
  const setup = await ensureEisSetupState(tenantId);

  await prisma.eisSetupState.update({
    where: { id: setup.id },
    data: { reminderDismissedAt: new Date() },
  });

  revalidatePath("/dashboard");
  return { success: "Reminder dismissed for now." };
}

export async function acknowledgeSetupCompletionAction(): Promise<BirSetupActionState> {
  const session = await requirePermission("compliance.view");
  const tenantId = session.user.tenantId;
  const setup = await ensureEisSetupState(tenantId);

  await prisma.eisSetupState.update({
    where: { id: setup.id },
    data: { completionAcknowledgedAt: new Date() },
  });

  revalidatePath("/dashboard");
  return { success: "Setup completion acknowledged." };
}

export async function runDataDiscoveryAction(
  _prev: BirSetupActionState,
  formData: FormData,
): Promise<BirSetupActionState> {
  const session = await requirePermission("compliance.validation.run");
  const tenantId = session.user.tenantId;
  const mode = String(formData.get("mode") ?? "erp_sandbox");

  let samples: Record<string, unknown>[] = [];
  let source: "erp_sandbox" | "json_upload" | "csv_upload" | "xml_upload" =
    "erp_sandbox";

  try {
    if (mode === "erp_sandbox") {
      const connection = await prisma.erpConnection.findFirst({
        where: { tenantId, deletedAt: null, enabled: true },
        orderBy: { updatedAt: "desc" },
      });
      if (!connection) {
        return { error: "Configure an ERP connection before running discovery." };
      }
      const pulled = sandboxErpRawSamples(connection.id);
      samples = pulled;
      source = "erp_sandbox";
    } else if (mode === "json_upload") {
      const raw = String(formData.get("payload") ?? "");
      samples = parseJsonSamples(raw);
      source = "json_upload";
    } else if (mode === "csv_upload") {
      const raw = String(formData.get("payload") ?? "");
      samples = parseCsvSamples(raw);
      source = "csv_upload";
    } else if (mode === "xml_upload") {
      const raw = String(formData.get("payload") ?? "");
      samples = parseXmlSamples(raw);
      source = "xml_upload";
    } else {
      return { error: "Unknown discovery mode" };
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to parse sample data",
    };
  }

  if (samples.length === 0) {
    return { error: "No sample rows found for discovery." };
  }

  const discovery = discoverFieldsFromSamples({ samples, source });
  const quality = runDataQualityScan(samples);
  const setup = await ensureEisSetupState(tenantId);

  await prisma.eisSetupState.update({
    where: { id: setup.id },
    data: {
      discoveryResult: discovery,
      discoveryAt: new Date(),
      qualityScanResult: quality,
      qualityScanAt: new Date(),
      wizardStartedAt: setup.wizardStartedAt ?? new Date(),
      currentStepKey: "discovery",
      requiresRevalidation: false,
      revalidationReason: null,
    },
  });

  await writeAuditLog({
    tenantId,
    userId: session.user.id,
    action: "VALIDATION_RUN",
    entityType: "eis_setup_state",
    entityId: setup.id,
    metadata: {
      discoverySampleCount: discovery.sampleCount,
      qualityErrors: quality.errors,
      qualityWarnings: quality.warnings,
      source,
    },
    reason: "ERP data discovery and quality scan (samples not transmitted to BIR)",
  });

  await clearRevalidationFlag(tenantId);
  revalidateSetupPaths();

  return {
    success: `Discovered ${discovery.fields.filter((f) => f.status === "FOUND").length} fields across ${discovery.sampleCount} sample(s). Samples were not sent to BIR.`,
  };
}

export async function saveAndExitSetupAction(
  stepKey: BirSetupStepKey,
): Promise<BirSetupActionState> {
  return setWizardStepAction(stepKey);
}
