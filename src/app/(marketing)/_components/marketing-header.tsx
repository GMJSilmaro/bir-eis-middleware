import Link from "next/link";

import { Button } from "@/components/ui/button";
import { marketingNav } from "@/content/marketing";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="shrink-0 font-semibold tracking-tight text-foreground"
        >
          BIR EIS | Pixelcare eInvoicing Middleware
        </Link>
        <nav
          aria-label="Landing sections"
          className="hidden items-center gap-1 md:flex"
        >
          {marketingNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
