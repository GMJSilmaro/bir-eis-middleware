"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import type { DocumentActionState } from "@/features/documents/actions/create-outbound-document.action";
import { queueOutboundDocumentAction } from "@/features/documents/actions/queue-outbound-document.action";
import { Button } from "@/components/ui/button";

export function QueueOutboundButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    queueOutboundDocumentAction,
    {} as DocumentActionState,
  );

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={documentId} />
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Queuing…
            </>
          ) : (
            "Queue for transmission"
          )}
        </Button>
      </div>
    </form>
  );
}
