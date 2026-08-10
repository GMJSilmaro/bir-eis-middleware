"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import type { DocumentActionState } from "@/features/documents/actions/create-outbound-document.action";
import { syncEisResponsesAction } from "@/features/documents/actions/sync-eis-responses.action";
import { Button } from "@/components/ui/button";

export function SyncEisResponsesButton() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    syncEisResponsesAction,
    {} as DocumentActionState,
  );

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      {state.error ? (
        <p className="text-sm text-sidebar-muted" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success && state.message ? (
        <p className="max-w-xs text-right text-sm text-sidebar-muted" role="status">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Syncing…
          </>
        ) : (
          <>
            <RefreshCw className="size-4" />
            Sync from EIS
          </>
        )}
      </Button>
    </form>
  );
}
