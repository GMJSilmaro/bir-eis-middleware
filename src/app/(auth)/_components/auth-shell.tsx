import { FileText } from "lucide-react";

import type { AuthBranding } from "@/features/provider/lib/resolve-auth-branding";
import {
  DEFAULT_PLATFORM_PRODUCT_NAME,
  DEFAULT_PLATFORM_PRODUCT_TAGLINE,
} from "@/features/provider/lib/get-platform-settings";

export type AuthShellBranding = Pick<
  AuthBranding,
  "productName" | "productTagline" | "logo" | "tenantOverlay"
>;

interface AuthShellProps {
  children: React.ReactNode;
  branding?: AuthShellBranding | null;
}

const highlights = [
  "Map ERP and API invoices into BIR-ready electronic documents",
  "Sign and transmit through EIS Cert and production channels",
  "Track accept and reject outcomes with a clear audit trail",
];

function BrandMark({
  productName,
  productTagline,
  logo,
  mutedClassName,
}: {
  productName: string;
  productTagline: string;
  logo: string | null;
  mutedClassName: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center overflow-hidden rounded-xl bg-primary/20">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URLs / remote logos
          <img
            src={logo}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <FileText className="size-5 text-primary" />
        )}
      </div>
      <div>
        <p className="text-sm font-semibold">{productName}</p>
        <p className={`text-xs ${mutedClassName}`}>{productTagline}</p>
      </div>
    </div>
  );
}

export function AuthShell({ children, branding }: AuthShellProps) {
  const productName =
    branding?.productName?.trim() || DEFAULT_PLATFORM_PRODUCT_NAME;
  const productTagline =
    branding?.productTagline?.trim() || DEFAULT_PLATFORM_PRODUCT_TAGLINE;
  const logo = branding?.logo ?? null;
  const tenantOverlay = branding?.tenantOverlay ?? false;

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.18),transparent_45%),radial-gradient(circle_at_80%_80%,hsl(var(--primary)/0.12),transparent_40%)]"
        />

        <div className="relative z-10 flex min-h-dvh w-full flex-col px-10 py-10 xl:px-16 xl:py-12">
          <BrandMark
            productName={productName}
            productTagline={productTagline}
            logo={logo}
            mutedClassName="text-sidebar-muted"
          />

          <div className="flex flex-1 items-center py-12">
            <div className="max-w-md space-y-6">
              <h2 className="text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
                {tenantOverlay
                  ? `Sign in to ${productName}`
                  : "Prepare, sign, and submit electronic invoices to BIR EIS"}
              </h2>
              <p className="text-sm leading-relaxed text-sidebar-muted">
                {tenantOverlay
                  ? "Access your organization’s e-invoice workspace to prepare, sign, and submit documents to BIR EIS."
                  : "Multi-tenant middleware for taxpayers who need structured JSON invoices, JWS signing, and reliable transmission to EIS Cert and production."}
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
            &copy; {new Date().getFullYear()}{" "}
            {tenantOverlay
              ? productName
              : "Pixelcare BIR EIS eInvoicing Middleware"}
          </p>
        </div>
      </div>

      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
        <div className="mb-8 w-full max-w-[420px] lg:hidden">
          <BrandMark
            productName={productName}
            productTagline={productTagline}
            logo={logo}
            mutedClassName="text-muted-foreground"
          />
        </div>

        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
