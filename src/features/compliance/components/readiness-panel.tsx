"use client";

import { useActionState, useState, useTransition } from "react";

import {
  enableProductionAction,
  markTestTransmissionPassedAction,
  refreshActivationGateAction,
  upsertCertificationProfileAction,
} from "@/features/compliance/actions/activation.action";
import { runOnboardingValidationAction } from "@/features/compliance/actions/taxpayer.action";
import type { ComplianceActionState } from "@/features/compliance/actions/taxpayer.action";
import { CERTIFICATION_STATUSES } from "@/features/compliance/engine/types";
import type { ReadinessAssessment } from "@/features/compliance/readiness/assess-readiness";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  settingsFieldClassName,
  settingsTextareaClassName,
} from "@/features/settings/lib/field-styles";

export function ReadinessPanel({
  assessment,
  gateState,
  productionEnabled,
  certification,
  canValidate,
  canSubmit,
  canManageCert,
  canEnableProduction,
}: {
  assessment: ReadinessAssessment;
  gateState: string;
  productionEnabled: boolean;
  certification: {
    pttNumber: string;
    status: string;
    certPortalNote: string;
    notes: string;
  };
  canValidate: boolean;
  canSubmit: boolean;
  canManageCert: boolean;
  canEnableProduction: boolean;
}) {
  const [certState, certAction] = useActionState(
    upsertCertificationProfileAction,
    {} as ComplianceActionState,
  );
  const [prodState, prodAction] = useActionState(
    enableProductionAction,
    {} as ComplianceActionState,
  );
  const [pending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState("");

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border px-4 py-3">
        <p className="text-sm text-muted-foreground">EIS Integration Readiness</p>
        <p className="text-lg font-semibold">{assessment.overallLabel}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Gate state: {gateState}
          {productionEnabled ? " · production enabled" : ""}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          This assessment is internal only. It is not BIR certification, approval,
          accreditation, or Permit to Transmit.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-2 font-medium">Category</th>
              <th className="py-2 font-medium">Result</th>
              <th className="py-2 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody>
            {assessment.categories.map((c) => (
              <tr key={c.key} className="border-b border-border/60">
                <td className="py-2 pr-3">{c.label}</td>
                <td className="py-2 pr-3 font-medium">{c.outcome}</td>
                <td className="py-2 text-muted-foreground">{c.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {assessment.blockingIssues.length > 0 ? (
        <div>
          <p className="text-sm font-medium">Blocking issues</p>
          <ul className="mt-1 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            {assessment.blockingIssues.map((issue) => (
              <li key={issue}>{issue.replace(/^\d+\.\s*/, "")}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {actionMessage ? (
        <p className="text-sm text-muted-foreground">{actionMessage}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canValidate ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await runOnboardingValidationAction();
                const refreshed = await refreshActivationGateAction();
                setActionMessage(refreshed.success ?? refreshed.error ?? "Done");
                window.location.reload();
              });
            }}
          >
            Run readiness validation
          </Button>
        ) : null}
        {canSubmit ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await markTestTransmissionPassedAction();
                setActionMessage(result.success ?? result.error ?? "Done");
                window.location.reload();
              });
            }}
          >
            Record sandbox test transmission
          </Button>
        ) : null}
      </div>

      <form action={certAction} className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
        <p className="sm:col-span-2 text-sm font-medium">
          Certification / PTT record (documentary)
        </p>
        {certState.error ? (
          <p className="sm:col-span-2 text-sm text-destructive">{certState.error}</p>
        ) : null}
        {certState.success ? (
          <p className="sm:col-span-2 text-sm text-emerald-700">{certState.success}</p>
        ) : null}
        <div className="space-y-1.5">
          <Label>PTT number</Label>
          <Input
            name="pttNumber"
            defaultValue={certification.pttNumber}
            disabled={!canManageCert}
            className={settingsFieldClassName}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <select
            name="status"
            defaultValue={certification.status || "NOT_RECORDED"}
            disabled={!canManageCert}
            className={settingsFieldClassName}
          >
            {CERTIFICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Cert portal note</Label>
          <textarea
            name="certPortalNote"
            defaultValue={certification.certPortalNote}
            disabled={!canManageCert}
            className={settingsTextareaClassName}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Notes</Label>
          <textarea
            name="notes"
            defaultValue={certification.notes}
            disabled={!canManageCert}
            className={settingsTextareaClassName}
          />
        </div>
        {canManageCert ? (
          <div className="sm:col-span-2">
            <ActionButton type="submit">Save certification record</ActionButton>
          </div>
        ) : null}
      </form>

      {canEnableProduction ? (
        <form action={prodAction} className="space-y-3 rounded-lg border border-border p-4">
          <p className="text-sm font-medium">Production activation</p>
          {prodState.error ? (
            <p className="text-sm text-destructive">{prodState.error}</p>
          ) : null}
          {prodState.success ? (
            <p className="text-sm text-emerald-700">{prodState.success}</p>
          ) : null}
          <div className="space-y-1.5">
            <Label>Override reason (required if gates incomplete)</Label>
            <textarea name="reason" className={settingsTextareaClassName} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="override" value="true" />
            Audited override (cannot mark certification as BIR-verified)
          </label>
          <ActionButton type="submit">Enable production transmission</ActionButton>
        </form>
      ) : null}
    </div>
  );
}
