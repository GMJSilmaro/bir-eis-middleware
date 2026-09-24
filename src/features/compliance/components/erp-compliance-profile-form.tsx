"use client";

import { useActionState } from "react";

import { updateErpComplianceProfileAction } from "@/features/compliance/actions/mapping.action";
import type { ComplianceActionState } from "@/features/compliance/actions/taxpayer.action";
import {
  ERP_INTEGRATION_METHODS,
  ERP_SYSTEM_TYPES,
} from "@/features/compliance/schemas/compliance.schema";
import { ActionButton } from "@/components/ui/action-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { settingsFieldClassName } from "@/features/settings/lib/field-styles";

type Props = {
  canEdit: boolean;
  connection: {
    id: string;
    name: string;
    provider: string;
    vendor: string;
    version: string;
    systemType: string;
    integrationMethod: string;
    scope: string;
    environment: string;
    connectionVerified: boolean;
  };
};

export function ErpComplianceProfileForm({ canEdit, connection }: Props) {
  const [state, formAction] = useActionState(
    updateErpComplianceProfileAction,
    {} as ComplianceActionState,
  );

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-border/70 p-4">
      <input type="hidden" name="id" value={connection.id} />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-medium">{connection.name}</p>
          <p className="text-xs text-muted-foreground">
            Provider: {connection.provider}
            {connection.connectionVerified ? " · connection verified" : ""}
          </p>
        </div>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-700" role="status">
          {state.success}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`vendor-${connection.id}`}>Vendor / product</Label>
          <Input
            id={`vendor-${connection.id}`}
            name="vendor"
            defaultValue={connection.vendor}
            disabled={!canEdit}
            className={settingsFieldClassName}
            placeholder="e.g. SAP Business One"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`version-${connection.id}`}>Version</Label>
          <Input
            id={`version-${connection.id}`}
            name="version"
            defaultValue={connection.version}
            disabled={!canEdit}
            className={settingsFieldClassName}
            placeholder="e.g. 10.x"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`systemType-${connection.id}`}>System type</Label>
          <select
            id={`systemType-${connection.id}`}
            name="systemType"
            defaultValue={connection.systemType}
            disabled={!canEdit}
            className={settingsFieldClassName}
          >
            <option value="">—</option>
            {ERP_SYSTEM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`integrationMethod-${connection.id}`}>
            Integration method
          </Label>
          <select
            id={`integrationMethod-${connection.id}`}
            name="integrationMethod"
            defaultValue={connection.integrationMethod}
            disabled={!canEdit}
            className={settingsFieldClassName}
          >
            <option value="">—</option>
            {ERP_INTEGRATION_METHODS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`scope-${connection.id}`}>HO / branch scope</Label>
          <select
            id={`scope-${connection.id}`}
            name="scope"
            defaultValue={connection.scope}
            disabled={!canEdit}
            className={settingsFieldClassName}
          >
            <option value="">—</option>
            <option value="head_office">Head office</option>
            <option value="branch">Branch</option>
            <option value="multi">Multi</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`environment-${connection.id}`}>Environment</Label>
          <select
            id={`environment-${connection.id}`}
            name="environment"
            defaultValue={connection.environment || "test"}
            disabled={!canEdit}
            className={settingsFieldClassName}
          >
            <option value="test">Test</option>
            <option value="prod">Production</option>
          </select>
        </div>
      </div>
      {canEdit ? (
        <ActionButton type="submit">Save ERP profile</ActionButton>
      ) : null}
    </form>
  );
}
