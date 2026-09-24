"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { complianceNavigation } from "@/config/compliance-navigation";
import { cn } from "@/utils/cn";

export function ComplianceSubnav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Compliance sections"
      className="flex flex-wrap gap-1 border-b border-border pb-2"
    >
      {complianceNavigation.map((item) => {
        const active =
          item.href === "/compliance"
            ? pathname === "/compliance"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
