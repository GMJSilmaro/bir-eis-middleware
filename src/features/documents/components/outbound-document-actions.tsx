"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { DocumentActionState } from "@/features/documents/actions/create-outbound-document.action";
import { queueOutboundDocumentAction } from "@/features/documents/actions/queue-outbound-document.action";
import { formatDocumentType } from "@/features/documents/lib/document-format";
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
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    queueOutboundDocumentAction,
    {} as DocumentActionState,
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  const onNavy = variant === "onNavy";
  const typeLabel = formatDocumentType(documentType);
  // Close on success without setState-in-effect (refresh remounts after queue).
  const dialogOpen = open && !state.success;

  function handleOpenChange(next: boolean) {
    if (pending && !next) return;
    setOpen(next);
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <div
        className={cn(
          "flex flex-col items-stretch gap-1 sm:items-end",
          className,
        )}
      >
        {state.error && !open ? (
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
            Submit to EIS
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit to EIS?</DialogTitle>
          <DialogDescription>
            Are you sure you want to submit this {typeLabel} to EIS? This will
            mark the document as ready for transmission.
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
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit to EIS"
              )}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
