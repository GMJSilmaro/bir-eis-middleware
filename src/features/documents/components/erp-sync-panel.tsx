"use client";

import Link from "next/link";
import { Loader2, PlugZap, RefreshCw } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  syncErpDocumentsAction,
  type SyncErpDocumentsState,
} from "@/features/documents/actions/sync-erp-documents.action";
import {
  ERP_PROVIDER_LABELS,
  ERP_PROVIDERS,
} from "@/features/settings/schemas/erp-connection.schema";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ErpSyncConnectionOption = {
  id: string;
  name: string;
  provider: string;
  lastSyncAt: string | null;
};

export function ErpSyncPanel({
  connections,
  onDone,
}: {
  connections: ErpSyncConnectionOption[];
  /** When set (e.g. modal), success CTA closes instead of navigating. */
  onDone?: () => void;
}) {
  const router = useRouter();
  const [connectionId, setConnectionId] = useState(
    connections[0]?.id ?? "",
  );
  const [state, formAction, pending] = useActionState(
    syncErpDocumentsAction,
    {} as SyncErpDocumentsState,
  );

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  if (connections.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-5 py-8 text-center">
        <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl border border-border/70 bg-card text-muted-foreground">
          <PlugZap className="size-5" aria-hidden />
        </span>
        <p className="text-sm font-medium text-foreground">
          No ERP connections yet
        </p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Add an enabled connection under Settings → Integrations to pull sample
          invoices into Outbound drafts.
        </p>
        <Button asChild variant="outline" className="mt-5 h-10 cursor-pointer">
          <Link href="/settings/integrations/erp">Open ERP connections</Link>
        </Button>
      </div>
    );
  }

  const selected = connections.find((c) => c.id === connectionId);

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="connectionId" value={connectionId} />
        <div className="space-y-2">
          <Label htmlFor="erp-sync-connection">ERP connection</Label>
          <Select
            value={connectionId}
            onValueChange={setConnectionId}
            disabled={pending}
          >
            <SelectTrigger
              id="erp-sync-connection"
              className="h-10 w-full cursor-pointer"
            >
              <SelectValue placeholder="Select connection" />
            </SelectTrigger>
            <SelectContent>
              {connections.map((connection) => {
                const provider = ERP_PROVIDERS.find(
                  (value) => value === connection.provider,
                );
                const providerLabel = provider
                  ? ERP_PROVIDER_LABELS[provider]
                  : connection.provider;
                return (
                  <SelectItem
                    key={connection.id}
                    value={connection.id}
                    className="cursor-pointer"
                  >
                    {connection.name} · {providerLabel}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {selected?.lastSyncAt ? (
            <p className="text-xs text-muted-foreground">
              Last sync{" "}
              {new Date(selected.lastSyncAt).toLocaleString("en-PH")}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              This connection has not synced yet.
            </p>
          )}
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

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            type="submit"
            disabled={pending || !connectionId}
            className="h-10 cursor-pointer"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Syncing…
              </>
            ) : (
              <>
                <RefreshCw className="size-4" />
                Sync now
              </>
            )}
          </Button>
          <Button asChild variant="ghost" className="h-10 cursor-pointer">
            <Link href="/settings/integrations/erp">Manage connections</Link>
          </Button>
        </div>
      </form>

      {state.errors && state.errors.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border/70">
          <div className="border-b border-border/60 bg-muted/40 px-3 py-2">
            <p className="text-sm font-medium text-foreground">
              Sync notes ({state.errors.length})
            </p>
          </div>
          <ul className="max-h-48 divide-y divide-border/50 overflow-auto text-sm">
            {state.errors.map((item, index) => (
              <li key={`${item.row}-${index}`} className="px-3 py-2">
                <span className="text-muted-foreground">Row {item.row}: </span>
                {item.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
