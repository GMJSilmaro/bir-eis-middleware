"use client";

import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ReleaseChangeType, ReleaseNote } from "@/content/releases";
import {
  formatReleaseDisplayDate,
  formatVersionLabel,
  getAllReleases,
} from "@/lib/shared/version";
import { cn } from "@/utils/cn";

const CHANGE_TYPE_LABEL: Record<ReleaseChangeType, string> = {
  feature: "New",
  improvement: "Improved",
  fix: "Fixed",
};

const CHANGE_TYPE_CLASS: Record<ReleaseChangeType, string> = {
  feature: "bg-primary/10 text-primary",
  improvement: "bg-sky-500/10 text-sky-700",
  fix: "bg-amber-500/10 text-amber-800",
};

interface WhatsNewDialogProps {
  children: ReactNode;
  triggerClassName?: string;
  triggerAriaLabel?: string;
}

function ChangeTypeBadge({ type }: { type: ReleaseChangeType }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center self-start rounded-md px-1.5 text-[10px] font-semibold leading-none tracking-wide uppercase",
        CHANGE_TYPE_CLASS[type],
      )}
    >
      {CHANGE_TYPE_LABEL[type]}
    </span>
  );
}

function ReleaseEntry({ release }: { release: ReleaseNote }) {
  const versionLabel = formatVersionLabel(release.version);
  const dateLabel = formatReleaseDisplayDate(release);
  const hasChanges = Boolean(release.changes && release.changes.length > 0);

  return (
    <article className="space-y-3 border-b border-border/70 pb-5 last:border-b-0 last:pb-0">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold leading-none text-primary">
            {versionLabel}
          </span>
          <time
            dateTime={release.releasedAt ?? release.date}
            className="text-xs text-muted-foreground"
          >
            {dateLabel}
          </time>
        </div>
        <h3 className="text-sm font-semibold text-foreground">{release.title}</h3>
      </header>

      {release.highlights.length > 0 ? (
        <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
          {release.highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2">
              <span
                className="mt-2 size-1 shrink-0 rounded-full bg-primary/50"
                aria-hidden
              />
              <span className="min-w-0">{highlight}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {hasChanges ? (
        <ul className="space-y-2.5">
          {release.changes!.map((change) => (
            <li
              key={`${change.type}-${change.description}`}
              className="flex items-start gap-2.5 text-sm"
            >
              <ChangeTypeBadge type={change.type} />
              <span className="min-w-0 leading-relaxed text-muted-foreground">
                {change.description}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

export function WhatsNewDialog({
  children,
  triggerClassName,
  triggerAriaLabel,
}: WhatsNewDialogProps) {
  const releases = getAllReleases();
  const currentLabel = formatVersionLabel();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "rounded-md px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            triggerClassName,
          )}
          aria-label={triggerAriaLabel ?? `What's new — ${currentLabel}`}
        >
          {children}
        </button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(85vh,40rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-border/70 px-6 py-4 text-left">
          <DialogTitle>What&apos;s new</DialogTitle>
          <DialogDescription>
            Recent updates for BIR EIS — newest first.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-4">
          {releases.map((release) => (
            <ReleaseEntry key={release.version} release={release} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
