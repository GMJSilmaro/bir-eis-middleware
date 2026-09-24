"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setWizardStepAction } from "@/features/bir-setup/actions/setup.action";
import type { EisSetupReadiness } from "@/features/bir-setup/lib/compute-eis-setup-readiness";
import { overallStatusLabel } from "@/features/bir-setup/lib/compute-eis-setup-readiness";
import type { BirSetupStepKey } from "@/features/bir-setup/lib/step-definitions";
import { BIR_SETUP_STEPS } from "@/features/bir-setup/lib/step-definitions";
import { cn } from "@/utils/cn";

function statusGlyph(status: string) {
  switch (status) {
    case "COMPLETE":
      return "✓";
    case "WARNING":
    case "NEEDS_RECHECK":
      return "!";
    case "BLOCKED":
      return "✕";
    case "INCOMPLETE":
      return "●";
    default:
      return "○";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "COMPLETE":
      return "text-emerald-700";
    case "WARNING":
    case "NEEDS_RECHECK":
      return "text-amber-700";
    case "BLOCKED":
    case "INCOMPLETE":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
}

type WizardShellProps = {
  readiness: EisSetupReadiness;
  activeStep: BirSetupStepKey;
  canManage: boolean;
  children: React.ReactNode;
};

export function BirEisSetupWizardShell({
  readiness,
  activeStep,
  canManage,
  children,
}: WizardShellProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const label = overallStatusLabel(readiness.status);

  function selectStep(key: BirSetupStepKey) {
    startTransition(async () => {
      await setWizardStepAction(key);
      router.push(`/settings/bir-eis-setup?step=${key}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-card px-5 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight sm:text-base">
              BIR EIS Setup
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-snug text-muted-foreground">
              Configure your organization, taxpayer profile, ERP/CAS integration,
              EIS credentials, field mappings, and validate your environment before
              enabling production transmission.
            </p>
          </div>
          <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-1.5 text-xs font-semibold tracking-wide text-foreground">
            {label}
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {readiness.completedSteps} of {readiness.totalRequiredSteps} setup stages
          completed
          {readiness.blockingIssues.length > 0
            ? ` · ${readiness.blockingIssues.length} item(s) require attention`
            : ""}
        </p>
        {readiness.requiresRevalidation ? (
          <p className="mt-2 text-sm text-amber-800" role="status">
            {readiness.revalidationReason ??
              "An upstream configuration changed. Some readiness checks need to be run again."}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground">
          Completing this setup configures your ERP-to-EIS integration. It does not
          mean BIR certification, accreditation, or approval.
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <nav
          aria-label="Setup steps"
          className="w-full shrink-0 overflow-x-auto rounded-xl border border-border/70 bg-card p-3 lg:w-56"
        >
          <ol className="flex min-w-max gap-2 lg:min-w-0 lg:flex-col lg:gap-1">
            {BIR_SETUP_STEPS.map((step) => {
              const result = readiness.steps.find((s) => s.key === step.key)!;
              const active = activeStep === step.key;
              return (
                <li key={step.key}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => selectStep(step.key)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                      active
                        ? "bg-primary/10 text-foreground"
                        : "hover:bg-muted/50 text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex size-5 shrink-0 items-center justify-center text-xs font-semibold",
                        statusClass(result.status),
                      )}
                      aria-hidden
                    >
                      {statusGlyph(result.status)}
                    </span>
                    <span className="truncate font-medium">{step.shortTitle}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="min-w-0 flex-1 space-y-4">
          {children}
          {!canManage ? (
            <p className="text-sm text-muted-foreground">
              You can review setup status. Ask a workspace admin to change
              configuration.{" "}
              <Link href="/compliance/readiness" className="text-primary underline-offset-2 hover:underline">
                View readiness
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
