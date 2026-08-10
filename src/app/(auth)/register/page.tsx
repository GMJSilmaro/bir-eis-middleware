import {
  AuthPageFooter,
  AuthPageHeader,
  AuthPageLink,
} from "@/app/(auth)/_components/auth-page-shell";
import { RegisterForm } from "@/app/(auth)/register/_components/register-form";

export const metadata = {
  title: "Register · BIR EIS",
  description: "Create your organization for BIR EIS middleware.",
};

export default function RegisterPage() {
  return (
    <div className="space-y-8">
      <AuthPageHeader
        title="Create your organization"
        description="You will be assigned the Tenant Admin role for your new workspace."
      />

      <RegisterForm />

      <AuthPageFooter>
        Already have an account? <AuthPageLink href="/login">Sign in</AuthPageLink>
      </AuthPageFooter>
    </div>
  );
}
