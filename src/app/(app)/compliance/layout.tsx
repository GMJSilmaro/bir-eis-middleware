import { ShieldCheck } from "lucide-react";

import { PageHeaderCard } from "@/app/(app)/_components/page-header-card";
import { ComplianceSubnav } from "@/features/compliance/components/compliance-subnav";
import { requirePermission } from "@/lib/auth/permissions";

export default async function ComplianceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("compliance.view");

  return (
    <div className="space-y-4">
      <PageHeaderCard
        title="Compliance"
        description="EIS integration readiness and documentary controls — not BIR certification or accreditation."
        icon={<ShieldCheck className="size-5" />}
      />
      <ComplianceSubnav />
      {children}
    </div>
  );
}
