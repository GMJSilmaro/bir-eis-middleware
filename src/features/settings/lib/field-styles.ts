import { cn } from "@/utils/cn";

/** Settings form controls — rounded-md (~8px), visible border, navy focus. */
export const settingsFieldClassName = cn(
  "h-10 rounded-md border-border bg-background px-3 shadow-none",
  "placeholder:text-muted-foreground/65",
  "focus-visible:border-primary/45 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/25",
);

export const settingsTextareaClassName = cn(
  "min-h-[5.5rem] rounded-md border-border bg-background px-3 py-2.5 shadow-none",
  "placeholder:text-muted-foreground/65",
  "focus-visible:border-primary/45 focus-visible:ring-2 focus-visible:ring-primary/25",
);

/** Trigger styles for Radix Select — matches text inputs. */
export const settingsSelectTriggerClassName = cn(
  "h-10 w-full rounded-md border-border bg-background shadow-none",
  "focus:border-primary/45 focus:ring-2 focus:ring-primary/25",
  "focus-visible:border-primary/45 focus-visible:ring-2 focus-visible:ring-primary/25",
);
