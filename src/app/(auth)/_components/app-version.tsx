"use client";

import { WhatsNewDialog } from "@/components/whats-new-dialog";
import { getVersionWithDateLabel } from "@/lib/shared/version";
import { cn } from "@/utils/cn";

interface AppVersionProps {
  className?: string;
}

export function AppVersion({ className }: AppVersionProps) {
  return (
    <WhatsNewDialog
      triggerClassName={cn(
        "w-full text-center text-xs text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {getVersionWithDateLabel()}
    </WhatsNewDialog>
  );
}
