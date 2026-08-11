"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Building2, LayoutDashboard, Palette } from "lucide-react";

import { cn } from "@/utils/cn";

const NAV_ITEMS = [
  { href: "/provider", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/provider/tenants", label: "Tenants", icon: Building2, exact: false },
  { href: "/provider/branding", label: "Branding", icon: Palette, exact: false },
] as const;

export function ProviderNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border/70 bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Provider console
            </p>
            <p className="text-sm font-semibold tracking-tight">
              Platform operations
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to dashboard
          </Link>
        </div>
        <nav className="flex flex-wrap gap-1" aria-label="Provider">
          {NAV_ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
