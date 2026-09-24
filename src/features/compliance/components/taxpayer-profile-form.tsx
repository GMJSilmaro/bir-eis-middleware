"use client";

import { useActionState } from "react";

import {
  upsertTaxpayerProfileAction,
  type ComplianceActionState,
} from "@/features/compliance/actions/taxpayer.action";
import { PROFILE_STATUSES } from "@/features/compliance/engine/types";
import { ActionButton } from "@/components/ui/action-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { settingsFieldClassName, settingsTextareaClassName } from "@/features/settings/lib/field-styles";

type TaxpayerFormProps = {
  canEdit: boolean;
  initial: {
    registeredName: string;
    tradeName?: string;
    tin: string;
    branchCode: string;
    officeType: string;
    rdoCode: string;
    classification: string;
    vatMode: string;
    businessAddress: string;
    businessType?: string;
    ecommerceEngaged?: string;
    usesCas?: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    profileStatus: string;
    notes: string;
  };
};

export function TaxpayerProfileForm({ canEdit, initial }: TaxpayerFormProps) {
  const [state, formAction] = useActionState(
    upsertTaxpayerProfileAction,
    {} as ComplianceActionState,
  );

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {state.error ? (
        <p className="sm:col-span-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="sm:col-span-2 text-sm text-emerald-700" role="status">
          {state.success}
        </p>
      ) : null}

      <Field label="Registered name" name="registeredName" defaultValue={initial.registeredName} disabled={!canEdit} required />
      <Field label="Trade name (optional)" name="tradeName" defaultValue={initial.tradeName ?? ""} disabled={!canEdit} />
      <Field label="TIN" name="tin" defaultValue={initial.tin} disabled={!canEdit} required />
      <Field label="Branch code" name="branchCode" defaultValue={initial.branchCode} disabled={!canEdit} required />
      <div className="space-y-1.5">
        <Label htmlFor="officeType">Head office / Branch</Label>
        <select
          id="officeType"
          name="officeType"
          defaultValue={initial.officeType || "head_office"}
          disabled={!canEdit}
          className={settingsFieldClassName}
        >
          <option value="head_office">Head office</option>
          <option value="branch">Branch</option>
        </select>
      </div>
      <Field label="RDO / LT office" name="rdoCode" defaultValue={initial.rdoCode} disabled={!canEdit} />
      <div className="space-y-1.5">
        <Label htmlFor="classification">Taxpayer classification</Label>
        <select
          id="classification"
          name="classification"
          defaultValue={initial.classification || ""}
          disabled={!canEdit}
          className={settingsFieldClassName}
        >
          <option value="">—</option>
          <option value="large_taxpayer">Large taxpayer</option>
          <option value="regular">Regular</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="vatMode">VAT status</Label>
        <select
          id="vatMode"
          name="vatMode"
          defaultValue={initial.vatMode || "vat"}
          disabled={!canEdit}
          className={settingsFieldClassName}
        >
          <option value="vat">VAT registered</option>
          <option value="non_vat">Non-VAT</option>
          <option value="other">Other / unknown</option>
        </select>
      </div>
      <Field label="Business type" name="businessType" defaultValue={initial.businessType ?? ""} disabled={!canEdit} />
      <div className="space-y-1.5">
        <Label htmlFor="ecommerceEngaged">Engaged in e-commerce / internet transactions?</Label>
        <select
          id="ecommerceEngaged"
          name="ecommerceEngaged"
          defaultValue={initial.ecommerceEngaged ?? ""}
          disabled={!canEdit}
          className={settingsFieldClassName}
        >
          <option value="">—</option>
          <option value="YES">Yes</option>
          <option value="NO">No</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="usesCas">Uses computerized accounting / invoicing?</Label>
        <select
          id="usesCas"
          name="usesCas"
          defaultValue={initial.usesCas ?? ""}
          disabled={!canEdit}
          className={settingsFieldClassName}
        >
          <option value="">—</option>
          <option value="YES">Yes</option>
          <option value="NO">No</option>
        </select>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="businessAddress">Registered business address</Label>
        <textarea
          id="businessAddress"
          name="businessAddress"
          defaultValue={initial.businessAddress}
          disabled={!canEdit}
          className={settingsTextareaClassName}
        />
      </div>
      <Field label="Contact name" name="contactName" defaultValue={initial.contactName} disabled={!canEdit} />
      <Field label="Contact email" name="contactEmail" defaultValue={initial.contactEmail} disabled={!canEdit} />
      <Field label="Contact phone" name="contactPhone" defaultValue={initial.contactPhone} disabled={!canEdit} />
      <div className="space-y-1.5">
        <Label htmlFor="profileStatus">Profile status</Label>
        <select
          id="profileStatus"
          name="profileStatus"
          defaultValue={initial.profileStatus || "NOT_PROVIDED"}
          disabled={!canEdit}
          className={settingsFieldClassName}
        >
          {PROFILE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Internal status only — never labeled as BIR Verified.
        </p>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={initial.notes}
          disabled={!canEdit}
          className={settingsTextareaClassName}
        />
      </div>
      {canEdit ? (
        <div className="sm:col-span-2">
          <ActionButton type="submit">Save taxpayer profile</ActionButton>
        </div>
      ) : null}
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  disabled,
  required,
}: {
  label: string;
  name: string;
  defaultValue: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        required={required}
        className={settingsFieldClassName}
      />
    </div>
  );
}
