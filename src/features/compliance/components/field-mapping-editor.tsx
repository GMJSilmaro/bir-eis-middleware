"use client";

import { useActionState, useMemo, useState } from "react";

import {
  saveFieldMappingsAction,
  seedDefaultFieldMappingsAction,
} from "@/features/compliance/actions/mapping.action";
import type { ComplianceActionState } from "@/features/compliance/actions/taxpayer.action";
import { CANONICAL_TO_EIS } from "@/features/compliance/lib/field-mapping-defaults";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { settingsFieldClassName } from "@/features/settings/lib/field-styles";

type MappingRow = {
  id?: string;
  erpField: string;
  canonicalField: string;
  eisField: string;
  required: boolean;
};

export function FieldMappingEditor({
  canEdit,
  connectionId,
  connectionName,
  initialRows,
}: {
  canEdit: boolean;
  connectionId: string;
  connectionName: string;
  initialRows: MappingRow[];
}) {
  const [rows, setRows] = useState<MappingRow[]>(initialRows);
  const [seedState, setSeedState] = useState<ComplianceActionState>({});
  const [saveState, saveAction] = useActionState(
    saveFieldMappingsAction,
    {} as ComplianceActionState,
  );

  const mappingsJson = useMemo(() => JSON.stringify(rows), [rows]);

  async function handleSeed() {
    const result = await seedDefaultFieldMappingsAction(connectionId);
    setSeedState(result);
    if (result.success) {
      window.location.reload();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{connectionName}</p>
        {canEdit && initialRows.length === 0 ? (
          <Button type="button" variant="outline" size="sm" onClick={handleSeed}>
            Seed default SAP-style map
          </Button>
        ) : null}
      </div>
      {seedState.error ? (
        <p className="text-sm text-destructive">{seedState.error}</p>
      ) : null}
      {seedState.success ? (
        <p className="text-sm text-emerald-700">{seedState.success}</p>
      ) : null}
      {saveState.error ? (
        <p className="text-sm text-destructive">{saveState.error}</p>
      ) : null}
      {saveState.success ? (
        <p className="text-sm text-emerald-700">{saveState.success}</p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-2 pr-2 font-medium">ERP field</th>
              <th className="py-2 pr-2 font-medium">Canonical</th>
              <th className="py-2 pr-2 font-medium">EIS field</th>
              <th className="py-2 font-medium">Required</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.erpField}-${index}`} className="border-b border-border/60">
                <td className="py-2 pr-2">
                  <Input
                    className={settingsFieldClassName}
                    value={row.erpField}
                    disabled={!canEdit}
                    onChange={(e) => {
                      const next = [...rows];
                      next[index] = { ...row, erpField: e.target.value };
                      setRows(next);
                    }}
                  />
                </td>
                <td className="py-2 pr-2">
                  <Input
                    className={settingsFieldClassName}
                    value={row.canonicalField}
                    disabled={!canEdit}
                    onChange={(e) => {
                      const next = [...rows];
                      const canonicalField = e.target.value;
                      next[index] = {
                        ...row,
                        canonicalField,
                        eisField:
                          row.eisField ||
                          CANONICAL_TO_EIS[canonicalField] ||
                          canonicalField,
                      };
                      setRows(next);
                    }}
                  />
                </td>
                <td className="py-2 pr-2">
                  <Input
                    className={settingsFieldClassName}
                    value={row.eisField}
                    disabled={!canEdit}
                    onChange={(e) => {
                      const next = [...rows];
                      next[index] = { ...row, eisField: e.target.value };
                      setRows(next);
                    }}
                  />
                </td>
                <td className="py-2">
                  <input
                    type="checkbox"
                    checked={row.required}
                    disabled={!canEdit}
                    onChange={(e) => {
                      const next = [...rows];
                      next[index] = { ...row, required: e.target.checked };
                      setRows(next);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canEdit ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setRows([
                ...rows,
                { erpField: "", canonicalField: "", eisField: "", required: false },
              ])
            }
          >
            Add row
          </Button>
          <form action={saveAction}>
            <input type="hidden" name="connectionId" value={connectionId} />
            <input type="hidden" name="mappingsJson" value={mappingsJson} />
            <ActionButton type="submit">Save mappings</ActionButton>
          </form>
        </div>
      ) : null}
    </div>
  );
}
