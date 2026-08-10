import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export interface SettingsContentCardProps {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

/**
 * Shared Settings pane chrome: section header + body aligned with the side nav.
 */
export function SettingsContentCard({
  title,
  description,
  children,
  className,
}: SettingsContentCardProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border/70 bg-card shadow-[0_4px_18px_rgba(15,23,42,0.06)]",
        className,
      )}
    >
      <header className="border-b border-border/60 px-5 py-3 sm:px-5">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground sm:text-base">
          {title}
        </h2>
        <p className="mt-0.5 max-w-2xl text-sm leading-snug text-muted-foreground">
          {description}
        </p>
      </header>
      <div className="px-5 py-4 sm:px-5">{children}</div>
    </section>
  );
}
