"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";

import {
  acknowledgeSetupCompletionAction,
  dismissSetupReminderAction,
  startOrResumeSetupAction,
} from "@/features/bir-setup/actions/setup.action";
import type { EisSetupReadiness } from "@/features/bir-setup/lib/compute-eis-setup-readiness";
import { overallStatusLabel } from "@/features/bir-setup/lib/compute-eis-setup-readiness";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/utils/cn";

const SESSION_DISMISS_KEY = "bir-eis-setup-modal-dismissed";

type Props = {
  readiness: EisSetupReadiness;
  canConfigure: boolean;
};

function setupHref(readiness: EisSetupReadiness) {
  const step = readiness.nextRequiredStep ?? "organization";
  return `/settings/bir-eis-setup?step=${step}`;
}

function subscribeSessionDismiss(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getSessionDismissedSnapshot() {
  try {
    return sessionStorage.getItem(SESSION_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function getServerDismissedSnapshot() {
  return true;
}

export function DashboardBirSetupSection({ readiness, canConfigure }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [userClosedModal, setUserClosedModal] = useState(false);
  const sessionDismissed = useSyncExternalStore(
    subscribeSessionDismiss,
    getSessionDismissedSnapshot,
    getServerDismissedSnapshot,
  );

  const hideReminders =
    readiness.status === "PRODUCTION_READY" ||
    readiness.status === "PRODUCTION_ENABLED";

  const shouldPrompt =
    !hideReminders &&
    (readiness.status === "NOT_STARTED" ||
      readiness.status === "IN_PROGRESS" ||
      readiness.status === "SETUP_REQUIRES_REVALIDATION");

  const modalOpen = shouldPrompt && !sessionDismissed && !userClosedModal;

  function remindLater() {
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setUserClosedModal(true);
    startTransition(async () => {
      await dismissSetupReminderAction();
      router.refresh();
    });
  }

  function startSetup() {
    startTransition(async () => {
      await startOrResumeSetupAction();
      router.push(setupHref(readiness));
      router.refresh();
    });
  }

  function acknowledge() {
    startTransition(async () => {
      await acknowledgeSetupCompletionAction();
      router.refresh();
    });
  }

  const showSuccess = hideReminders && !readiness.completionAcknowledgedAt;
  const showBanner = !hideReminders;
  const showCard = !hideReminders || showSuccess;
  const isFirstTime = readiness.status === "NOT_STARTED";

  return (
    <div className="space-y-4">
      {showBanner ? (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 sm:px-5",
            readiness.requiresRevalidation
              ? "border-amber-300/80 bg-amber-50/80"
              : "border-sky-300/70 bg-sky-50/70",
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {readiness.requiresRevalidation
                  ? "BIR EIS setup needs revalidation"
                  : "BIR EIS setup incomplete"}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {readiness.requiresRevalidation
                  ? readiness.revalidationReason ??
                    "Your configuration changed. Some readiness checks need to be run again."
                  : "Complete your integration setup before production transmission can be enabled."}
              </p>
              {readiness.nextRequiredStep ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Next:{" "}
                  <span className="font-medium text-foreground">
                    {readiness.steps.find((s) => s.key === readiness.nextRequiredStep)
                      ?.title ?? readiness.nextRequiredStep}
                  </span>
                </p>
              ) : null}
            </div>
            <Button size="sm" asChild>
              <Link href={setupHref(readiness)}>
                {canConfigure ? "Continue Setup →" : "View Status"}
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      {showSuccess ? (
        <div className="rounded-xl border border-emerald-300/70 bg-emerald-50/70 px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-foreground">
              BIR EIS integration setup completed.
            </p>
            <Button size="sm" variant="outline" disabled={pending} onClick={acknowledge}>
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}

      {showCard ? (
        <section className="rounded-xl border border-border/70 bg-card px-4 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.06)] sm:px-5">
          {hideReminders ? (
            <>
              <h2 className="text-sm font-semibold">EIS Integration</h2>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Environment</dt>
                  <dd className="font-medium">
                    {readiness.environment === "prod"
                      ? "Production"
                      : readiness.environment === "cert"
                        ? "Sandbox"
                        : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">ERP</dt>
                  <dd className="font-medium">{readiness.erpLabel ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">ERP Connection</dt>
                  <dd className="font-medium">
                    {readiness.erpConnected ? "Connected" : "Not verified"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Validation</dt>
                  <dd className="font-medium">
                    {readiness.validationPassed ? "Passed" : "Pending"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Last Test</dt>
                  <dd className="font-medium">
                    {readiness.lastTestAt
                      ? new Date(readiness.lastTestAt).toLocaleString()
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Readiness</dt>
                  <dd className="font-medium">
                    {overallStatusLabel(readiness.status)}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                Ready means integration readiness requirements passed — not BIR
                certification.
              </p>
              <Button asChild size="sm" variant="outline" className="mt-3">
                <Link href="/settings/bir-eis-setup">Review Setup</Link>
              </Button>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold">
                    BIR EIS Integration Setup
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Setup Progress · {readiness.completedSteps} of{" "}
                    {readiness.totalRequiredSteps} stages completed
                  </p>
                </div>
                <Button size="sm" asChild>
                  <Link href={setupHref(readiness)}>
                    {canConfigure ? "Continue Setup" : "View Status"}
                  </Link>
                </Button>
              </div>
              <ul className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
                {readiness.steps.map((step) => (
                  <li key={step.key} className="flex items-center gap-2">
                    <span
                      className={
                        step.status === "COMPLETE"
                          ? "text-emerald-700"
                          : step.status === "WARNING" ||
                              step.status === "NEEDS_RECHECK"
                            ? "text-amber-700"
                            : "text-muted-foreground"
                      }
                    >
                      {step.status === "COMPLETE"
                        ? "✓"
                        : step.status === "WARNING" ||
                            step.status === "NEEDS_RECHECK"
                          ? "!"
                          : "○"}
                    </span>
                    <span>{step.shortTitle}</span>
                  </li>
                ))}
              </ul>
              {readiness.nextRequiredStep ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Next required action:{" "}
                  <span className="font-medium text-foreground">
                    {readiness.steps.find((s) => s.key === readiness.nextRequiredStep)
                      ?.title}
                  </span>
                </p>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) setUserClosedModal(true);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isFirstTime
                ? "Complete your BIR EIS setup"
                : readiness.requiresRevalidation
                  ? "Review BIR EIS setup changes"
                  : "Continue your BIR EIS setup"}
            </DialogTitle>
            <DialogDescription className="text-left">
              {isFirstTime
                ? "Before using the EIS integration, we need some information about your company, BIR taxpayer profile, ERP/CAS, and EIS setup. This information is used to configure your integration, validate your source data, and determine whether the environment is ready for EIS testing and transmission."
                : canConfigure
                  ? "Your integration setup is incomplete."
                  : "Your organization’s BIR EIS setup is still being configured."}
            </DialogDescription>
          </DialogHeader>

          {isFirstTime ? (
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>✓ Company &amp; taxpayer information</li>
              <li>✓ ERP / CAS details</li>
              <li>✓ CAS registration documentation</li>
              <li>✓ EIS credentials / PTT information</li>
              <li>✓ ERP field mapping</li>
              <li>✓ Validation and test transmission</li>
            </ul>
          ) : (
            <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
              {readiness.steps.map((step) => (
                <li key={step.key} className="flex items-center gap-2">
                  <span>
                    {step.status === "COMPLETE"
                      ? "✓"
                      : step.status === "WARNING" ||
                          step.status === "NEEDS_RECHECK"
                        ? "!"
                        : "○"}
                  </span>
                  <span>{step.title}</span>
                </li>
              ))}
            </ul>
          )}

          {!isFirstTime && readiness.nextRequiredStep ? (
            <p className="text-sm text-muted-foreground">
              Next required step:{" "}
              <span className="font-medium text-foreground">
                {readiness.steps.find((s) => s.key === readiness.nextRequiredStep)
                  ?.title}
              </span>
            </p>
          ) : null}

          <p className="text-xs text-muted-foreground">
            You can save your progress and continue later. Completing setup does
            not mean BIR certification or legal compliance by itself.
          </p>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={remindLater}
            >
              Remind Me Later
            </Button>
            <Button type="button" disabled={pending} onClick={startSetup}>
              {canConfigure
                ? isFirstTime
                  ? "Start Setup →"
                  : "Continue Setup →"
                : "View Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
