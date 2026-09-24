/**
 * Sidebar footer promo card (optional).
 * Intentionally avoids implying BIR certification or accreditation.
 */
export function IntegratedPortalCard() {
  return (
    <div className="mx-2 mb-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-sidebar-accent-foreground">
          EIS Integration Readiness
        </p>
        <p className="text-xs leading-snug text-sidebar-muted">
          Prepare mapping, validation, and sandbox transmission before production.
          Readiness is not BIR certification.
        </p>
      </div>
    </div>
  );
}
