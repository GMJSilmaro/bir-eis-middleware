import {
  EIS_ACK_STATUSES,
  EIS_ACK_STATUS_LABELS,
  OUTBOUND_STATUSES,
  OUTBOUND_STATUS_LABELS,
} from "@/features/documents/schemas/document.schema";
import { cn } from "@/utils/cn";

type OutboundStatus = (typeof OUTBOUND_STATUSES)[number];
type AckStatus = (typeof EIS_ACK_STATUSES)[number];

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  queued: "bg-amber-50 text-amber-800",
  submitted: "bg-sky-50 text-sky-800",
  accepted: "bg-teal-50 text-teal-800",
  rejected: "bg-red-50 text-red-700",
  pending: "bg-slate-100 text-slate-700",
};

function labelForStatus(status: string) {
  return (
    OUTBOUND_STATUS_LABELS[status as OutboundStatus] ??
    status.replace(/_/g, " ")
  );
}

export function DocumentStatusBadge({
  status,
  direction: _direction,
  className,
}: {
  status: string;
  /** Kept for call-site compatibility; statuses use outbound labels. */
  direction?: "outbound" | "inbound";
  className?: string;
}) {
  void _direction;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold capitalize",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {labelForStatus(status)}
    </span>
  );
}

export function EisAckStatusBadge({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  if (!status) {
    return (
      <span className={cn("text-sm text-muted-foreground", className)}>—</span>
    );
  }

  const label =
    EIS_ACK_STATUS_LABELS[status as AckStatus] ?? status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold capitalize",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {label}
    </span>
  );
}
