"use client";

import { CalendarDays } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { DashboardNavySurface } from "@/app/(app)/dashboard/_components/dashboard-navy-surface";
import { cn } from "@/utils/cn";

function formatClock(date: Date): string {
  return date.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export interface PageHeaderCardProps {
  title: string;
  description?: string;
  /** Leading badge content (pass a React element, e.g. `<Gauge className="size-5" />`). */
  icon?: ReactNode;
  /** Custom right-side content. Ignored when `showLiveClock` is true. */
  aside?: ReactNode;
  /** Renders a live clock and long date on the right. */
  showLiveClock?: boolean;
  className?: string;
}

function LiveClockAside() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="shrink-0 space-y-1 text-left sm:text-right">
      <p className="font-mono text-lg font-semibold tabular-nums tracking-wide sm:text-xl">
        {formatClock(now)}
      </p>
      <p className="inline-flex items-center gap-1.5 text-sm text-sidebar-muted sm:justify-end">
        <CalendarDays className="size-3.5 shrink-0" aria-hidden />
        <span>{formatLongDate(now)}</span>
      </p>
    </div>
  );
}

/**
 * Reusable navy page banner: leading icon + title/subtitle, optional aside or live clock.
 */
export function PageHeaderCard({
  title,
  description,
  icon,
  aside,
  showLiveClock = false,
  className,
}: PageHeaderCardProps) {
  const right = showLiveClock ? <LiveClockAside /> : aside;

  return (
    <DashboardNavySurface
      className={cn(
        "rounded-xl px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.12)] sm:px-6",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {icon != null ? (
            <div
              className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/15 text-sidebar-foreground"
              aria-hidden
            >
              {icon}
            </div>
          ) : null}
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {title}
            </h1>
            {description ? (
              <p className="text-sm text-sidebar-muted">{description}</p>
            ) : null}
          </div>
        </div>
        {right}
      </div>
    </DashboardNavySurface>
  );
}
