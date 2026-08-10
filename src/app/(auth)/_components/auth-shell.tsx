import { FileText } from "lucide-react";

interface AuthShellProps {
  children: React.ReactNode;
}

const highlights = [
  "Map ERP and API invoices into BIR-ready electronic documents",
  "Sign and transmit through EIS Cert and production channels",
  "Track accept and reject outcomes with a clear audit trail",
];

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.18),transparent_45%),radial-gradient(circle_at_80%_80%,hsl(var(--primary)/0.12),transparent_40%)]"
        />

        <div className="relative z-10 flex min-h-dvh w-full flex-col px-10 py-10 xl:px-16 xl:py-12">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/20">
              <FileText className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">BIR EIS</p>
              <p className="text-xs text-sidebar-muted">e-Invoice Middleware</p>
            </div>
          </div>

          <div className="flex flex-1 items-center py-12">
            <div className="max-w-md space-y-6">
              <h2 className="text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
                Prepare, sign, and submit electronic invoices to BIR EIS
              </h2>
              <p className="text-sm leading-relaxed text-sidebar-muted">
                Multi-tenant middleware for taxpayers who need structured JSON
                invoices, JWS signing, and reliable transmission to EIS Cert and
                production.
              </p>
              <ul className="space-y-3">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-xs text-sidebar-muted">
            &copy; {new Date().getFullYear()} BIR EIS Middleware
          </p>
        </div>
      </div>

      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
        <div className="mb-8 flex w-full max-w-[420px] items-center gap-3 lg:hidden">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">BIR EIS</p>
            <p className="text-xs text-muted-foreground">e-Invoice Middleware</p>
          </div>
        </div>

        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
