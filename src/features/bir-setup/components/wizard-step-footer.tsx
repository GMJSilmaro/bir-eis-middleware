"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  saveAndExitSetupAction,
  setWizardStepAction,
} from "@/features/bir-setup/actions/setup.action";
import {
  getAdjacentStep,
  type BirSetupStepKey,
} from "@/features/bir-setup/lib/step-definitions";
import { Button } from "@/components/ui/button";

type FooterProps = {
  activeStep: BirSetupStepKey;
  canManage: boolean;
};

export function WizardStepFooter({ activeStep, canManage }: FooterProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const prev = getAdjacentStep(activeStep, "prev");
  const next = getAdjacentStep(activeStep, "next");

  function go(step: BirSetupStepKey | null) {
    if (!step) return;
    startTransition(async () => {
      await setWizardStepAction(step);
      router.push(`/settings/bir-eis-setup?step=${step}`);
      router.refresh();
    });
  }

  function exit() {
    startTransition(async () => {
      await saveAndExitSetupAction(activeStep);
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!prev || pending}
          onClick={() => go(prev)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={exit}
        >
          Save &amp; Exit
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {canManage ? (
          <Button type="button" size="sm" disabled={!next || pending} onClick={() => go(next)}>
            {next ? "Continue →" : "Done"}
          </Button>
        ) : (
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href="/compliance/readiness">View Status</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
