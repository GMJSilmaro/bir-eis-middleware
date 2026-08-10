"use client";

import Link from "next/link";
import { FileSpreadsheet, PenLine, Plus, RefreshCw } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/utils/cn";

function AvailableNowBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-md bg-primary/12 px-1.5 py-0.5 text-[10px] font-semibold leading-none tracking-wide text-primary uppercase">
      Available now
    </span>
  );
}

function ComingSoonBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-md border border-border/70 bg-background/70 px-1.5 py-0.5 text-[10px] font-semibold leading-none tracking-wide text-muted-foreground uppercase backdrop-blur-sm">
      Coming soon
    </span>
  );
}

type OptionCardShellProps = {
  children: ReactNode;
  className?: string;
  animationDelayClass: string;
};

function OptionCardShell({
  children,
  className,
  animationDelayClass,
}: OptionCardShellProps) {
  return (
    <div
      className={cn(
        "h-full animate-in fade-in-0 slide-in-from-bottom-3 fill-mode-both duration-300 motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:transform-none",
        animationDelayClass,
        className,
      )}
    >
      {children}
    </div>
  );
}

const optionCardBase =
  "group relative flex h-full min-h-[11.5rem] flex-col items-center gap-4 overflow-hidden rounded-2xl border p-5 pt-6 text-center transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out motion-reduce:transition-none sm:min-h-[12.5rem] sm:p-6";

export function NewDocumentChooser() {
  const [open, setOpen] = useState(false);

  return (
    <div className="ml-auto flex justify-end">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button">
            <Plus className="size-4" />
            New document
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[min(90vh,40rem)] gap-5 overflow-y-auto bg-card sm:max-w-2xl">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.07),transparent_55%),radial-gradient(circle_at_100%_0%,hsl(var(--accent)/0.55),transparent_40%)]"
          />

          <DialogHeader className="relative z-10">
            <DialogTitle>Create outbound document</DialogTitle>
            <DialogDescription>
              Choose how you want to prepare a new invoice or receipt.
            </DialogDescription>
          </DialogHeader>

          <div className="relative z-10 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <OptionCardShell animationDelayClass="delay-75">
              <Link
                href="/outbound/new"
                onClick={() => setOpen(false)}
                className={cn(
                  optionCardBase,
                  "border-primary/35 bg-linear-to-b from-primary/9 to-card shadow-sm shadow-primary/5",
                  "hover:-translate-y-1 hover:border-primary/60 hover:shadow-md hover:shadow-primary/15",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "motion-reduce:hover:translate-y-0",
                )}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-8 left-1/2 size-28 -translate-x-1/2 rounded-full bg-primary/10 blur-2xl transition-opacity duration-200 group-hover:opacity-90"
                />
                <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.18)] transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-rotate-3 motion-reduce:group-hover:scale-100 motion-reduce:group-hover:rotate-0">
                  <PenLine className="size-5 sm:size-6" aria-hidden />
                </span>
                <span className="relative min-w-0 space-y-2">
                  <span className="flex flex-col items-center justify-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground">
                      Manual
                    </span>
                    <AvailableNowBadge />
                  </span>
                  <span className="block text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
                    Enter invoice or receipt details yourself in the draft form.
                  </span>
                </span>
              </Link>
            </OptionCardShell>

            <OptionCardShell animationDelayClass="delay-150">
              <div
                aria-disabled="true"
                className={cn(
                  optionCardBase,
                  "cursor-not-allowed border-dashed border-border/90 bg-muted/25 opacity-90 select-none",
                )}
              >
                <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground shadow-[inset_0_0_0_1px_hsl(var(--border))]">
                  <RefreshCw className="size-5 sm:size-6" aria-hidden />
                </span>
                <span className="relative min-w-0 space-y-2">
                  <span className="flex flex-col items-center justify-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground">
                      ERP Sync
                    </span>
                    <ComingSoonBadge />
                  </span>
                  <span className="block text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
                    Pull documents from SAP B1, Acumatica, ERPNext, and other
                    ERPs.
                  </span>
                </span>
              </div>
            </OptionCardShell>

            <OptionCardShell animationDelayClass="delay-200">
              <div
                aria-disabled="true"
                className={cn(
                  optionCardBase,
                  "cursor-not-allowed border-dashed border-border/90 bg-muted/25 opacity-90 select-none",
                )}
              >
                <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground shadow-[inset_0_0_0_1px_hsl(var(--border))]">
                  <FileSpreadsheet className="size-5 sm:size-6" aria-hidden />
                </span>
                <span className="relative min-w-0 space-y-2">
                  <span className="flex flex-col items-center justify-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground">
                      Excel File
                    </span>
                    <ComingSoonBadge />
                  </span>
                  <span className="block text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
                    Upload a spreadsheet template to create multiple drafts at
                    once.
                  </span>
                </span>
              </div>
            </OptionCardShell>
          </div>

          <p className="relative z-10 text-center text-[11px] leading-relaxed text-muted-foreground/80 sm:text-xs">
            More ways to create documents are coming soon.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
