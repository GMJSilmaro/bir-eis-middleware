import { TaxpayerProfileForm } from "@/features/compliance/components/taxpayer-profile-form";
import { ensureTaxpayerProfile } from "@/features/compliance/lib/compliance-queries";
import { SettingsContentCard } from "@/features/settings/components/settings-content-card";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";

export default async function ComplianceTaxpayerPage() {
  const session = await requirePermission("compliance.view");
  const profile = await ensureTaxpayerProfile(session.user.tenantId);
  const canEdit = hasPermission(
    session.user.permissions,
    "compliance.taxpayer.edit",
  );

  return (
    <SettingsContentCard
      title="Taxpayer profile"
      description="Documentary taxpayer information for EIS readiness. This app does not verify data with BIR."
    >
      <TaxpayerProfileForm
        canEdit={canEdit}
        initial={{
          registeredName: profile.registeredName ?? "",
          tin: profile.tin ?? "",
          branchCode: profile.branchCode ?? "",
          officeType: profile.officeType ?? "head_office",
          rdoCode: profile.rdoCode ?? "",
          classification: profile.classification ?? "",
          vatMode: profile.vatMode ?? "vat",
          businessAddress: profile.businessAddress ?? "",
          contactName: profile.contactName ?? "",
          contactEmail: profile.contactEmail ?? "",
          contactPhone: profile.contactPhone ?? "",
          profileStatus: profile.profileStatus,
          notes: profile.notes ?? "",
        }}
      />
    </SettingsContentCard>
  );
}
