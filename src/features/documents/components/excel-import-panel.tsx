"use client";

import Link from "next/link";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { useActionState, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";

import {
  importOutboundCsvAction,
  type ImportOutboundCsvState,
} from "@/features/documents/actions/import-outbound-csv.action";
import { OUTBOUND_CSV_MAX_ROWS } from "@/features/documents/lib/bir-portal-field-map";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/cn";

export function ExcelImportPanel({
  onDone,
}: {
  /** When set (e.g. modal), success CTA closes instead of navigating. */
  onDone?: () => void;
}) {
  const router = useRouter();
  const fileInputId = useId();
  const [fileName, setFileName] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    importOutboundCsvAction,
    {} as ImportOutboundCsvState,
  );

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/15 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium text-foreground">
            Start with the template
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
            CSV only · up to {OUTBOUND_CSV_MAX_ROWS} rows per upload
          </p>
        </div>
        <Button asChild variant="outline" className="h-10 shrink-0 cursor-pointer">
          <Link href="/outbound/import/template" prefetch={false}>
            <Download className="size-4" />
            Download CSV template
          </Link>
        </Button>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={fileInputId}>Upload filled CSV</Label>
          <label
            htmlFor={fileInputId}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-card px-4 py-8 text-center transition-colors",
              "hover:border-primary/40 hover:bg-muted/30",
              pending && "pointer-events-none opacity-60",
            )}
          >
            <span className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-muted/40 text-muted-foreground">
              <FileSpreadsheet className="size-5" aria-hidden />
            </span>
            <span className="space-y-0.5">
              <span className="block text-sm font-medium text-foreground">
                {fileName ? fileName : "Choose a CSV file"}
              </span>
              <span className="block text-xs text-muted-foreground">
                {fileName
                  ? "Click to choose a different file"
                  : "Click to browse · .csv"}
              </span>
            </span>
            <input
              id={fileInputId}
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
              disabled={pending}
              className="sr-only"
              onChange={(event) => {
                const next = event.target.files?.[0]?.name ?? null;
                setFileName(next);
              }}
            />
          </label>
        </div>

        {state.error ? (
          <div
            className="rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive"
            role="alert"
          >
            {state.error}
          </div>
        ) : null}
        {state.success && state.message ? (
          <div
            className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5 text-sm text-emerald-800 dark:text-emerald-200"
            role="status"
          >
            {state.message}{" "}
            {onDone ? (
              <button
                type="button"
                onClick={onDone}
                className="cursor-pointer font-medium underline-offset-2 hover:underline"
              >
                Done
              </button>
            ) : (
              <Link
                href="/outbound"
                className="cursor-pointer font-medium underline-offset-2 hover:underline"
              >
                View Outbound
              </Link>
            )}
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={pending}
          className="h-10 cursor-pointer"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Importing…
            </>
          ) : (
            <>
              <Upload className="size-4" />
              Import drafts
            </>
          )}
        </Button>
      </form>

      {state.errors && state.errors.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border/70">
          <div className="border-b border-border/60 bg-muted/40 px-3 py-2">
            <p className="text-sm font-medium text-foreground">
              Row results ({state.errors.length})
            </p>
          </div>
          <div className="max-h-64 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-card text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Row</th>
                  <th className="px-3 py-2 font-medium">Message</th>
                </tr>
              </thead>
              <tbody>
                {state.errors.map((item, index) => (
                  <tr
                    key={`${item.row}-${index}`}
                    className="border-t border-border/50"
                  >
                    <td className="px-3 py-2 align-top tabular-nums text-muted-foreground">
                      {item.row || "—"}
                    </td>
                    <td className="px-3 py-2 text-foreground">{item.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
