"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";

import type { DocumentActionState } from "@/features/documents/actions/create-outbound-document.action";
import {
  queueOutboundDocumentAction,
  transmitOutboundDocumentAction,
} from "@/features/documents/actions/queue-outbound-document.action";
import { formatDocumentType } from "@/features/documents/lib/document-format";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/utils/cn";

type QueueOutboundButtonProps = {
  documentId: string;
  documentType: string;
  /** Use `onNavy` when rendering in a DashboardNavySurface header. */
  variant?: "default" | "onNavy";
  className?: string;
};

export function QueueOutboundButton({
  documentId,
  documentType,
  variant = "default",
  className,
}: QueueOutboundButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successDismissed, setSuccessDismissed] = useState(false);
  const [state, formAction, pending] = useActionState(
    queueOutboundDocumentAction,
    {} as DocumentActionState,
  );

  const onNavy = variant === "onNavy";
  const typeLabel = formatDocumentType(documentType);
  const confirmDialogOpen = confirmOpen && !state.success;
  const successOpen = Boolean(state.success && !successDismissed);

  function handleConfirmOpenChange(next: boolean) {
    if (pending && !next) return;
    setConfirmOpen(next);
  }

  function handleSuccessOpenChange(next: boolean) {
    if (!next) {
      setSuccessDismissed(true);
      router.refresh();
    }
  }

  return (
    <>
      <Dialog open={confirmDialogOpen} onOpenChange={handleConfirmOpenChange}>
        <div
          className={cn(
            "flex flex-col items-stretch gap-1 sm:items-end",
            className,
          )}
        >
          {state.error && !confirmOpen && !successOpen ? (
            <p
              className={cn(
                "text-sm",
                onNavy ? "text-rose-200" : "text-destructive",
              )}
              role="alert"
            >
              {state.error}
            </p>
          ) : null}
          <DialogTrigger asChild>
            <Button type="button" variant={variant}>
              Queue for EIS
            </Button>
          </DialogTrigger>
        </div>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Queue for EIS transmission?</DialogTitle>
            <DialogDescription>
              This runs pre-transmission compliance checks and marks the{" "}
              {typeLabel} as queued. It does not by itself mean BIR accepted the
              document.
            </DialogDescription>
          </DialogHeader>
          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Cancel
              </Button>
            </DialogClose>
            <form action={formAction}>
              <input type="hidden" name="id" value={documentId} />
              <ActionButton
                type="submit"
                loading={pending}
                loadingText="Queuing…"
              >
                Queue for EIS
              </ActionButton>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={successOpen} onOpenChange={handleSuccessOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Queued for EIS</DialogTitle>
            <DialogDescription>
              {state.message ??
                "This document is queued. Use Transmit (sandbox) to send a test submission."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => handleSuccessOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TransmitSandboxButton({
  documentId,
  className,
}: {
  documentId: string;
  className?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    transmitOutboundDocumentAction,
    {} as DocumentActionState,
  );

  return (
    <form action={formAction} className={cn("flex flex-col gap-1", className)}>
      <input type="hidden" name="id" value={documentId} />
      <ActionButton type="submit" loading={pending} loadingText="Transmitting…">
        Transmit (sandbox)
      </ActionButton>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-700" role="status">
          {state.message}
        </p>
      ) : null}
      {state.success || state.error ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.refresh()}
        >
          Refresh
        </Button>
      ) : null}
    </form>
  );
}
