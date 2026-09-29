import Link from "next/link";

import { BirEisSetupWizardShell } from "@/features/bir-setup/components/bir-eis-setup-wizard-shell";
import { DataDiscoveryPanel } from "@/features/bir-setup/components/data-discovery-panel";
import { WizardStepFooter } from "@/features/bir-setup/components/wizard-step-footer";
import {
  ensureEisSetupState,
  getEisSetupReadiness,
} from "@/features/bir-setup/lib/get-eis-setup-readiness";
import type { DiscoveryResult, QualityScanResult } from "@/features/bir-setup/lib/data-discovery";
import {
  getStepDefinition,
  isBirSetupStepKey,
  type BirSetupStepKey,
} from "@/features/bir-setup/lib/step-definitions";
import { TaxpayerProfileForm } from "@/features/compliance/components/taxpayer-profile-form";
import { CasRegistrationForms } from "@/features/compliance/components/cas-registration-forms";
import { ErpComplianceProfileForm } from "@/features/compliance/components/erp-compliance-profile-form";
import { FieldMappingEditor } from "@/features/compliance/components/field-mapping-editor";
import { ReadinessPanel } from "@/features/compliance/components/readiness-panel";
import { RunReconciliationButton } from "@/features/compliance/components/run-reconciliation-button";
import { buildReadinessForTenant } from "@/features/compliance/actions/activation.action";
import {
  ensureTaxpayerProfile,
  loadComplianceContexts,
} from "@/features/compliance/lib/compliance-queries";
import { defaultMappingsFromLegacyFieldMap } from "@/features/compliance/lib/field-mapping-defaults";
import { SettingsContentCard } from "@/features/settings/components/settings-content-card";
import { Button } from "@/components/ui/button";
import {
  hasPermission,
  requirePermission,
} from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export const metadata = {
  title: "BIR EIS Setup · Settings · BIR EIS",
};

type PageProps = {
  searchParams: Promise<{ step?: string }>;
};

export default async function BirEisSetupPage({ searchParams }: PageProps) {
  const session = await requirePermission("settings.view");
  const tenantId = session.user.tenantId;
  const params = await searchParams;

  const canManage = hasPermission(session.user.permissions, "settings.manage");
  const canEditTaxpayer = hasPermission(
    session.user.permissions,
    "compliance.taxpayer.edit",
  );
  const canReviewCas = hasPermission(
    session.user.permissions,
    "compliance.cas.review",
  );
  const canEditMapping = hasPermission(
    session.user.permissions,
    "compliance.mapping.edit",
  );
  const canValidate = hasPermission(
    session.user.permissions,
    "compliance.validation.run",
  );
  const canCertify = hasPermission(
    session.user.permissions,
    "compliance.certification.manage",
  );
  const canEnableProd = hasPermission(
    session.user.permissions,
    "compliance.production.enable",
  );
  const canSubmit = hasPermission(session.user.permissions, "compliance.submit");

  const [readiness, setup, ctx, tenant, credential] = await Promise.all([
    getEisSetupReadiness(tenantId),
    ensureEisSetupState(tenantId),
    loadComplianceContexts(tenantId),
    prisma.tenant.findFirstOrThrow({
      where: { id: tenantId, deletedAt: null },
      select: { name: true, tagline: true, logo: true },
    }),
    prisma.eisCredential.findFirst({
      where: { tenantId, deletedAt: null },
      select: {
        tin: true,
        environment: true,
        pttNumber: true,
        pttStatus: true,
        apiKeyLast4: true,
      },
    }),
  ]);

  const requested = params.step;
  const activeStep: BirSetupStepKey =
    requested && isBirSetupStepKey(requested)
      ? requested
      : readiness.nextRequiredStep && isBirSetupStepKey(readiness.nextRequiredStep)
        ? readiness.nextRequiredStep
        : isBirSetupStepKey(setup.currentStepKey)
          ? setup.currentStepKey
          : "organization";

  const stepDef = getStepDefinition(activeStep);
  const discovery = (setup.discoveryResult ?? null) as DiscoveryResult | null;
  const quality = (setup.qualityScanResult ?? null) as QualityScanResult | null;

  await ensureTaxpayerProfile(tenantId);
  const taxpayer = await prisma.taxpayerProfile.findUnique({ where: { tenantId } });

  let mappingInitial: Array<{
    erpField: string;
    canonicalField: string;
    eisField: string;
    required: boolean;
  }> = [];
  if (ctx.erp) {
    if (ctx.mappings.length > 0) {
      mappingInitial = ctx.mappings.map((m) => ({
        erpField: m.erpField,
        canonicalField: m.canonicalField,
        eisField: m.eisField ?? "",
        required: m.required,
      }));
    } else {
      mappingInitial = defaultMappingsFromLegacyFieldMap(
        (ctx.erp.fieldMap as Record<string, string> | null) ?? null,
      );
    }
  }

  const assessment =
    activeStep === "production" || activeStep === "validation"
      ? await buildReadinessForTenant(tenantId)
      : null;

  return (
    <BirEisSetupWizardShell
      readiness={readiness}
      activeStep={activeStep}
      canManage={canManage || canEditTaxpayer}
    >
      <SettingsContentCard
        title={`Step ${stepDef.number} — ${stepDef.title}`}
        description={stepDef.description}
      >
        {activeStep === "organization" ? (
          <div className="space-y-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Company name</dt>
                <dd className="mt-0.5 font-medium">{tenant.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Tagline</dt>
                <dd className="mt-0.5 font-medium">{tenant.tagline || "—"}</dd>
              </div>
            </dl>
            {tenant.logo ? (
              <div>
                <p className="text-sm text-muted-foreground">Logo</p>
                <div className="mt-2 inline-flex rounded-md border border-border/70 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tenant.logo}
                    alt={`${tenant.name} logo`}
                    className="h-12 w-auto max-w-[160px] object-contain"
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No logo uploaded yet.</p>
            )}
            <Button asChild size="sm" variant="outline">
              <Link href="/settings/organization">Edit Organization</Link>
            </Button>
          </div>
        ) : null}

        {activeStep === "taxpayer" && taxpayer ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              We need this information to configure your ERP-to-EIS integration,
              apply the appropriate validation rules, map your source data, and
              determine whether required setup steps are complete.
            </p>
            <TaxpayerProfileForm
              canEdit={canEditTaxpayer}
              initial={{
                registeredName: taxpayer.registeredName ?? "",
                tin: taxpayer.tin ?? "",
                branchCode: taxpayer.branchCode ?? "",
                officeType: taxpayer.officeType ?? "head_office",
                rdoCode: taxpayer.rdoCode ?? "",
                classification: taxpayer.classification ?? "",
                vatMode: taxpayer.vatMode ?? "vat",
                businessAddress: taxpayer.businessAddress ?? "",
                contactName: taxpayer.contactName ?? "",
                contactEmail: taxpayer.contactEmail ?? "",
                contactPhone: taxpayer.contactPhone ?? "",
                profileStatus: taxpayer.profileStatus,
                notes: taxpayer.notes ?? "",
                tradeName: taxpayer.tradeName ?? "",
                businessType: taxpayer.businessType ?? "",
                ecommerceEngaged: taxpayer.ecommerceEngaged ?? "",
                usesCas: taxpayer.usesCas ?? "",
              }}
            />
          </div>
        ) : null}

        {activeStep === "erp" ? (
          <div className="space-y-4">
            {ctx.erp ? (
              <ErpComplianceProfileForm
                canEdit={canEditMapping || canManage}
                connection={{
                  id: ctx.erp.id,
                  name: ctx.erp.name,
                  provider: ctx.erp.provider,
                  vendor: ctx.erp.vendor ?? "",
                  version: ctx.erp.version ?? "",
                  systemType: ctx.erp.systemType ?? "",
                  integrationMethod: ctx.erp.integrationMethod ?? "",
                  scope: ctx.erp.scope ?? "",
                  environment: ctx.erp.environment ?? "test",
                  connectionVerified: ctx.erp.connectionVerified,
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                No ERP connection yet.
              </p>
            )}
            <div className="rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-sm">
              <p className="font-medium">Connection checks</p>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                <li>
                  Connection —{" "}
                  {ctx.erp?.connectionVerified ? "PASS" : "NOT VERIFIED"}
                </li>
                <li>Authentication — {ctx.erp?.secretLast4 ? "PASS" : "NOT CONFIGURED"}</li>
                <li>
                  Data Access — {ctx.erp?.lastSyncAt ? "PASS" : "NOT TESTED"}
                </li>
                <li>
                  CAS Documents —{" "}
                  {ctx.cas?.status === "REVIEWED" ? "REVIEWED" : "NOT REVIEWED"}
                </li>
                <li>EIS Readiness — NOT TESTED via connection alone</li>
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                A successful network connection does not mean CAS/EIS compliant.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/settings/integrations/erp">Manage ERP Connections</Link>
            </Button>
          </div>
        ) : null}

        {activeStep === "cas_docs" ? (
          <div className="space-y-3">
            <p className="rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              Document status reflects records provided and reviewed within this
              system. It does not independently verify registration with BIR.
            </p>
            <CasRegistrationForms
              canEdit={canEditMapping || canManage}
              canReview={canReviewCas}
              records={
                ctx.cas
                  ? [
                      {
                        id: ctx.cas.id,
                        ackCertificateRef: ctx.cas.ackCertificateRef ?? "",
                        issuedAt: ctx.cas.issuedAt
                          ? ctx.cas.issuedAt.toISOString().slice(0, 10)
                          : "",
                        registeredSystem: ctx.cas.registeredSystem ?? "",
                        systemVersion: ctx.cas.systemVersion ?? "",
                        rdoOffice: ctx.cas.rdoOffice ?? "",
                        applicability: ctx.cas.applicability ?? "",
                        status: ctx.cas.status,
                        notes: ctx.cas.notes ?? "",
                      },
                    ]
                  : []
              }
            />
          </div>
        ) : null}

        {activeStep === "credentials" ? (
          <div className="space-y-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <StatusRow
                label="TIN"
                value={credential?.tin ? "CONFIGURED" : "MISSING"}
              />
              <StatusRow
                label="PTT"
                value={
                  credential?.pttNumber || credential?.pttStatus === "active"
                    ? "CONFIGURED"
                    : "MISSING"
                }
              />
              <StatusRow
                label="API credentials"
                value={
                  credential?.apiKeyLast4
                    ? `••••••••••••••${credential.apiKeyLast4}`
                    : "MISSING"
                }
              />
              <StatusRow
                label="Environment"
                value={
                  credential?.environment === "prod"
                    ? "PRODUCTION"
                    : credential?.environment === "cert"
                      ? "SANDBOX"
                      : "NOT SET"
                }
              />
            </dl>
            <p className="text-xs text-muted-foreground">
              Entering a PTT value records documentary information in this system.
              It is not independent BIR verification.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/settings/eis-credentials">Manage EIS Credentials</Link>
            </Button>
          </div>
        ) : null}

        {activeStep === "discovery" ? (
          <DataDiscoveryPanel
            canRun={canValidate}
            erpConnected={Boolean(ctx.erp?.connectionVerified)}
            discovery={discovery}
            quality={quality}
          />
        ) : null}

        {activeStep === "mapping" ? (
          <div className="space-y-3">
            {ctx.erp ? (
              <FieldMappingEditor
                canEdit={canEditMapping}
                connectionId={ctx.erp.id}
                connectionName={ctx.erp.name}
                initialRows={mappingInitial}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Configure an ERP connection before mapping fields.
              </p>
            )}
            <Button asChild size="sm" variant="outline">
              <Link href="/compliance/mapping">Open full mapping editor</Link>
            </Button>
          </div>
        ) : null}

        {activeStep === "validation" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Validation uses the shared compliance rule engine. Failures should be
              corrected in ERP/source data or authorized mapping — amounts are never
              silently altered.
            </p>
            {assessment ? (
              <ul className="divide-y divide-border/60 rounded-md border border-border/70 text-sm">
                {assessment.categories.map((c) => (
                  <li
                    key={c.key}
                    className="flex items-start justify-between gap-3 px-3 py-2"
                  >
                    <span>{c.label}</span>
                    <span
                      className={
                        c.outcome === "PASS"
                          ? "font-medium text-emerald-700"
                          : c.blocking
                            ? "font-medium text-destructive"
                            : "text-amber-700"
                      }
                    >
                      {c.outcome}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <Button asChild size="sm" variant="outline">
              <Link href="/compliance/rules">Open rules &amp; revalidate</Link>
            </Button>
          </div>
        ) : null}

        {activeStep === "testing" ? (
          <div className="space-y-4">
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <StatusRow
                label="Test transmission"
                value={
                  ctx.activation?.testTransmissionPassed ? "PASS" : "NOT COMPLETE"
                }
              />
              <StatusRow
                label="Reconciliation"
                value={
                  ctx.activation?.reconciliationPassed ? "PASS" : "NOT COMPLETE"
                }
              />
            </dl>
            <p className="text-sm text-muted-foreground">
              Queue a sandbox invoice from Outbound, sync the EIS response, then mark
              test transmission and run reconciliation. Credentials are never exposed
              in results.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/outbound">Open Outbound</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/compliance/readiness">Mark test / readiness</Link>
              </Button>
              {canValidate ? <RunReconciliationButton canRun={canValidate} /> : null}
            </div>
          </div>
        ) : null}

        {activeStep === "production" && assessment ? (
          <div className="space-y-3">
            <ReadinessPanel
              assessment={assessment}
              gateState={ctx.activation?.gateState ?? "DRAFT"}
              productionEnabled={Boolean(ctx.activation?.productionEnabled)}
              certification={{
                pttNumber: ctx.certification?.pttNumber ?? "",
                status: ctx.certification?.status ?? "NOT_RECORDED",
                certPortalNote: ctx.certification?.certPortalNote ?? "",
                notes: ctx.certification?.notes ?? "",
              }}
              canManageCert={canCertify}
              canEnableProduction={canEnableProd}
              canSubmit={canSubmit}
              canValidate={canValidate}
            />
            <p className="text-xs text-muted-foreground">
              “Ready” means our EIS integration readiness requirements passed. It
              does not imply independent BIR certification.
            </p>
          </div>
        ) : null}

        <WizardStepFooter
          activeStep={activeStep}
          canManage={canManage || canEditTaxpayer}
        />
      </SettingsContentCard>
    </BirEisSetupWizardShell>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
