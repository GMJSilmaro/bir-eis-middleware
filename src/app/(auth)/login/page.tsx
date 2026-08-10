import { Suspense } from "react";

import { AuthPageHeader } from "@/app/(auth)/_components/auth-page-shell";
import { LoginForm } from "@/app/(auth)/login/_components/login-form";

export const metadata = {
  title: "Sign in · BIR EIS",
  description: "Sign in to your BIR EIS middleware workspace.",
};

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <AuthPageHeader
        title="Sign in to BIR EIS"
        description="Use your work email to access your organization’s e-invoice workspace."
      />

      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
