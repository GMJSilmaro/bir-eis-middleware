import type { HTMLAttributes } from "react";

import { cn } from "@/utils/cn";

type DashboardNavySurfaceProps = HTMLAttributes<HTMLDivElement>;

/**
 * Shared lighter navy panel used for dashboard banners and card headers.
 * Gradient + soft decorative circles come from `.dashboard-navy-surface` in globals.css.
 */
export function DashboardNavySurface({
  className,
  children,
  ...props
}: DashboardNavySurfaceProps) {
  return (
    <div className={cn("dashboard-navy-surface", className)} {...props}>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
