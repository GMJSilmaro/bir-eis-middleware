"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  runDataDiscoveryAction,
  type BirSetupActionState,
} from "@/features/bir-setup/actions/setup.action";
import type { DiscoveryResult, QualityScanResult } from "@/features/bir-setup/lib/data-discovery";
import { ActionButton } from "@/components/ui/action-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  settingsFieldClassName,
  settingsTextareaClassName,
} from "@/features/settings/lib/field-styles";

type Props = {
  canRun: boolean;
  erpConnected: boolean;
  discovery: DiscoveryResult | null;
  quality: QualityScanResult | null;
};

export function DataDiscoveryPanel({
  canRun,
  erpConnected,
  discovery,
  quality,
}: Props) {
  const [state, formAction] = useActionState(
    runDataDiscoveryAction,
    {} as BirSetupActionState,
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Fetch or upload sample transactions to discover ERP fields and scan data
        quality. Sample data is never transmitted to BIR.
      </p>

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

      <form action={formAction} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="mode">Source</Label>
          <select
            id="mode"
            name="mode"
            defaultValue={erpConnected ? "erp_sandbox" : "json_upload"}
            disabled={!canRun}
            className={settingsFieldClassName}
          >
            <option value="erp_sandbox" disabled={!erpConnected}>
              Test data access (sandbox ERP sample)
            </option>
            <option value="json_upload">Upload JSON</option>
            <option value="csv_upload">Upload CSV</option>
            <option value="xml_upload">Upload XML</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="payload">Paste sample payload (for upload modes)</Label>
          <Textarea
            id="payload"
            name="payload"
            rows={5}
            disabled={!canRun}
            className={settingsTextareaClassName}
            placeholder='[{"DocNum":"SI-1","DocDate":"2026-09-01","CardName":"Buyer","LicTradNum":"123-456-789-00000"}]'
          />
        </div>
        <ActionButton type="submit" disabled={!canRun} size="sm">
          Run discovery
        </ActionButton>
        {!erpConnected ? (
          <p className="text-sm text-muted-foreground">
            ERP connection is not verified yet. You can still upload samples, or{" "}
            <Link
              href="/settings/integrations/erp"
              className="text-primary underline-offset-2 hover:underline"
            >
              manage ERP connections
            </Link>
            .
          </p>
        ) : null}
      </form>

      {discovery ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">ERP data discovery</h3>
          <p className="text-xs text-muted-foreground">
            {discovery.sampleCount} sample(s) · source {discovery.source} ·{" "}
            {new Date(discovery.discoveredAt).toLocaleString()}
          </p>
          <ul className="divide-y divide-border/60 rounded-md border border-border/70">
            {discovery.fields.map((field) => (
              <li
                key={field.key}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <span>{field.label}</span>
                <span
                  className={
                    field.status === "FOUND"
                      ? "font-medium text-emerald-700"
                      : field.status === "PARTIAL"
                        ? "font-medium text-amber-700"
                        : "text-muted-foreground"
                  }
                >
                  {field.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {quality ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Data quality</h3>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              Customers analyzed: {quality.customersAnalyzed}
            </div>
            <div>
              Transactions sampled: {quality.transactionsSampled}
            </div>
            <div>Valid TIN: {quality.validTin}</div>
            <div>Missing TIN: {quality.missingTin}</div>
            <div>Invalid format: {quality.invalidTinFormat}</div>
            <div>Tax mismatch: {quality.taxMismatch}</div>
          </dl>
          <ul className="space-y-1.5 text-sm">
            {quality.issues.map((issue) => (
              <li key={issue.code}>
                <span
                  className={
                    issue.severity === "ERROR"
                      ? "font-medium text-destructive"
                      : issue.severity === "WARNING"
                        ? "font-medium text-amber-700"
                        : "text-muted-foreground"
                  }
                >
                  {issue.severity}
                </span>
                {" — "}
                {issue.message}
                {issue.count != null ? ` (${issue.count})` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
