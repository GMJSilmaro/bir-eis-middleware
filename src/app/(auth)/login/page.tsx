import { Suspense } from "react";

import { AuthPageHeader } from "@/app/(auth)/_components/auth-page-shell";
import { AuthShell } from "@/app/(auth)/_components/auth-shell";
import { LoginForm } from "@/app/(auth)/login/_components/login-form";
import { resolveAuthBranding } from "@/features/provider/lib/resolve-auth-branding";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  const params = await searchParams;
  const branding = await resolveAuthBranding(params.tenant);
  return {
    title: `Sign in · ${branding.productName}`,
    description: `Sign in to your ${branding.productName} workspace.`,
  };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  const params = await searchParams;
  const branding = await resolveAuthBranding(params.tenant);

  return (
    <AuthShell branding={branding}>
      <div className="space-y-8">
        <AuthPageHeader
          title={`Sign in to ${branding.productName}`}
          description={
            branding.tenantOverlay
              ? "Use your work email to access this organization’s e-invoice workspace."
              : "Use your work email to access your organization’s e-invoice workspace."
          }
        />

        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
        >
          <LoginForm />
        </Suspense>
      </div>
    </AuthShell>
  );
}
