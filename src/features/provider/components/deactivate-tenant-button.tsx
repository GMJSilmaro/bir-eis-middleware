"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  deactivateTenantAction,
  type DeactivateTenantActionState,
} from "@/features/provider/actions/deactivate-tenant.action";
import { Button } from "@/components/ui/button";

export interface DeactivateTenantButtonProps {
  tenantId: string;
  tenantName: string;
}

export function DeactivateTenantButton({
  tenantId,
  tenantName,
}: DeactivateTenantButtonProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    deactivateTenantAction,
    {} as DeactivateTenantActionState,
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Deactivate “${tenantName}”? Users in this workspace will no longer be able to sign in once sessions expire.`,
          )
        ) {
          event.preventDefault();
        }
      }}
      className="space-y-2"
    >
      <input type="hidden" name="tenantId" value={tenantId} />
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Deactivating…
          </>
        ) : (
          "Deactivate workspace"
        )}
      </Button>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-300">
          Workspace deactivated.
        </p>
      ) : null}
    </form>
  );
}
