"use client";

import { useActionState } from "react";

import {
  reviewCasRegistrationAction,
  upsertCasRegistrationAction,
} from "@/features/compliance/actions/cas.action";
import type { ComplianceActionState } from "@/features/compliance/actions/taxpayer.action";
import { CAS_STATUSES } from "@/features/compliance/engine/types";
import { ActionButton } from "@/components/ui/action-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  settingsFieldClassName,
  settingsTextareaClassName,
} from "@/features/settings/lib/field-styles";

type RecordShape = {
  id: string;
  ackCertificateRef: string;
  issuedAt: string;
  registeredSystem: string;
  systemVersion: string;
  rdoOffice: string;
  applicability: string;
  status: string;
  notes: string;
};

export function CasRegistrationForms({
  canEdit,
  canReview,
  records,
}: {
  canEdit: boolean;
  canReview: boolean;
  records: RecordShape[];
}) {
  const [createState, createAction] = useActionState(
    upsertCasRegistrationAction,
    {} as ComplianceActionState,
  );

  return (
    <div className="space-y-6">
      {records.map((r) => (
        <CasRecordRow
          key={r.id}
          record={r}
          canEdit={canEdit}
          canReview={canReview}
        />
      ))}

      {canEdit ? (
        <form action={createAction} className="grid gap-3 rounded-lg border border-dashed border-border p-4 sm:grid-cols-2">
          <p className="sm:col-span-2 text-sm font-medium">Add CAS registration evidence</p>
          {createState.error ? (
            <p className="sm:col-span-2 text-sm text-destructive">{createState.error}</p>
          ) : null}
          {createState.success ? (
            <p className="sm:col-span-2 text-sm text-emerald-700">{createState.success}</p>
          ) : null}
          <Field name="ackCertificateRef" label="Acknowledgement certificate reference" />
          <Field name="issuedAt" label="Issuance date (YYYY-MM-DD)" />
          <Field name="registeredSystem" label="Registered system / software" />
          <Field name="systemVersion" label="Version" />
          <Field name="rdoOffice" label="RDO / LT office" />
          <div className="space-y-1.5">
            <Label htmlFor="applicability">Applicability</Label>
            <select id="applicability" name="applicability" className={settingsFieldClassName} defaultValue="">
              <option value="">—</option>
              <option value="head_office">Head office</option>
              <option value="branch">Branch</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select id="status" name="status" className={settingsFieldClassName} defaultValue="PROVIDED">
              {CAS_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea id="notes" name="notes" className={settingsTextareaClassName} />
          </div>
          <div className="sm:col-span-2">
            <ActionButton type="submit">Save CAS evidence</ActionButton>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function CasRecordRow({
  record,
  canEdit,
  canReview,
}: {
  record: RecordShape;
  canEdit: boolean;
  canReview: boolean;
}) {
  const [state, formAction] = useActionState(
    upsertCasRegistrationAction,
    {} as ComplianceActionState,
  );
  const [reviewState, reviewAction] = useActionState(
    reviewCasRegistrationAction,
    {} as ComplianceActionState,
  );

  return (
    <div className="space-y-3 rounded-lg border border-border/70 p-4">
      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="id" value={record.id} />
        <p className="sm:col-span-2 text-sm">
          Status: <span className="font-medium">{record.status}</span>
        </p>
        {state.error ? (
          <p className="sm:col-span-2 text-sm text-destructive">{state.error}</p>
        ) : null}
        {state.success ? (
          <p className="sm:col-span-2 text-sm text-emerald-700">{state.success}</p>
        ) : null}
        <Field name="ackCertificateRef" label="Certificate reference" defaultValue={record.ackCertificateRef} disabled={!canEdit} />
        <Field name="issuedAt" label="Issuance date" defaultValue={record.issuedAt} disabled={!canEdit} />
        <Field name="registeredSystem" label="Registered system" defaultValue={record.registeredSystem} disabled={!canEdit} />
        <Field name="systemVersion" label="Version" defaultValue={record.systemVersion} disabled={!canEdit} />
        <Field name="rdoOffice" label="RDO / LT office" defaultValue={record.rdoOffice} disabled={!canEdit} />
        <div className="space-y-1.5">
          <Label>Applicability</Label>
          <select name="applicability" defaultValue={record.applicability} disabled={!canEdit} className={settingsFieldClassName}>
            <option value="">—</option>
            <option value="head_office">Head office</option>
            <option value="branch">Branch</option>
            <option value="both">Both</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <select name="status" defaultValue={record.status} disabled={!canEdit} className={settingsFieldClassName}>
            {CAS_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Notes</Label>
          <textarea name="notes" defaultValue={record.notes} disabled={!canEdit} className={settingsTextareaClassName} />
        </div>
        {canEdit ? (
          <div className="sm:col-span-2">
            <ActionButton type="submit">Update evidence</ActionButton>
          </div>
        ) : null}
      </form>

      {canReview ? (
        <form action={reviewAction} className="flex flex-wrap items-end gap-2 border-t border-border pt-3">
          <input type="hidden" name="id" value={record.id} />
          <div className="space-y-1.5">
            <Label>Internal review</Label>
            <select name="status" className={settingsFieldClassName} defaultValue="REVIEWED">
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="REVIEWED">REVIEWED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
          <Input name="notes" placeholder="Review notes" className={settingsFieldClassName} />
          <ActionButton type="submit">Record review</ActionButton>
          {reviewState.success ? (
            <p className="w-full text-sm text-emerald-700">{reviewState.success}</p>
          ) : null}
          {reviewState.error ? (
            <p className="w-full text-sm text-destructive">{reviewState.error}</p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
  disabled,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        className={settingsFieldClassName}
      />
    </div>
  );
}
