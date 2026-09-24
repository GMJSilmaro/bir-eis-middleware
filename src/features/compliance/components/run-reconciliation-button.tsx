"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { runReconciliationAction } from "@/features/compliance/actions/activation.action";
import { Button } from "@/components/ui/button";

export function RunReconciliationButton({ canRun }: { canRun: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!canRun) return null;

  return (
    <Button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await runReconciliationAction();
          router.refresh();
        });
      }}
    >
      {pending ? "Running…" : "Run reconciliation"}
    </Button>
  );
}
