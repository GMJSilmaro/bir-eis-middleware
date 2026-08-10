"use client";

/**
 * Sidebar footer promo card ("BIR/EIS Compliance Ready").
 * Currently unused in the app shell — kept for future reuse.
 * Re-enable via `app-sidebar.tsx` (import + SidebarFooter).
 */

import { Landmark } from "lucide-react";

export function IntegratedPortalCard() {
  return (
    <div className="mx-2.5 mb-3 rounded-2xl border border-white/80 bg-white p-4 text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.14)] group-data-[collapsible=icon]:hidden">
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className="relative flex size-14 shrink-0 items-center justify-center rounded-full border-[3px] border-primary/25 bg-linear-to-b from-accent to-white text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
          aria-hidden
        >
          <div className="absolute inset-1 rounded-full border border-primary/15" />
          <Landmark className="relative size-6" strokeWidth={1.6} />
        </div>
        <div className="min-w-0 space-y-0.5 leading-snug">
          <p className="text-sm font-semibold tracking-tight">
            BIR/EIS Compliance Ready
          </p>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Compliance and reporting for BIR and EIS made easy with our integrated portal.
          </p>
        </div>
      </div>
    </div>
  );
}
