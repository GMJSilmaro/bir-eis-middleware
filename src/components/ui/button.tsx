import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "rounded-lg border border-input bg-background text-foreground shadow-none hover:border-foreground/20 hover:bg-muted hover:text-foreground active:bg-muted/80",
        secondary:
          "rounded-lg border border-border/80 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/70 hover:text-secondary-foreground",
        ghost: "rounded-lg hover:bg-accent hover:text-accent-foreground",
        link: "rounded-lg text-primary underline-offset-4 hover:underline",
        onNavy:
          "rounded-lg bg-white text-slate-900 shadow-sm hover:bg-white/90 hover:text-slate-900",
        onNavyOutline:
          "rounded-lg border border-white/70 bg-transparent text-white shadow-none hover:bg-white hover:text-slate-900",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
