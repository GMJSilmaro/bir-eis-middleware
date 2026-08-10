"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { settingsNavigation } from "@/config/settings-navigation";
import { cn } from "@/utils/cn";

export function SettingsSideNav() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "w-full shrink-0 rounded-xl border border-border bg-card p-3",
        "shadow-[0_4px_18px_rgba(15,23,42,0.06)]",
        "md:w-56 lg:w-60",
      )}
    >
      <nav aria-label="Settings sections" className="flex flex-col gap-6">
        {settingsNavigation.map((group) => {
          const GroupIcon = group.icon;
          return (
            <div key={group.label} className="flex flex-col gap-2">
              <p className="flex items-center gap-1.5 px-2.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground/80 uppercase">
                {GroupIcon ? (
                  <GroupIcon
                    className="size-3.5 shrink-0 text-primary/70"
                    aria-hidden
                  />
                ) : null}
                {group.label}
              </p>
              <ul className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative flex items-start gap-3 rounded-lg px-2.5 py-2.5 transition-colors",
                          active
                            ? "bg-primary/[0.07] text-foreground"
                            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                        )}
                      >
                        {active ? (
                          <span
                            aria-hidden
                            className="absolute top-2 bottom-2 left-0 w-0.75 rounded-full bg-primary"
                          />
                        ) : null}
                        <span
                          className={cn(
                            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md",
                            active
                              ? "bg-primary/12 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                          aria-hidden
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 space-y-0.5 pt-0.5">
                          <span
                            className={cn(
                              "block text-sm leading-snug",
                              active
                                ? "font-semibold text-foreground"
                                : "font-medium text-foreground/85",
                            )}
                          >
                            {item.title}
                          </span>
                          <span className="block text-[11px] leading-snug text-muted-foreground/85">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
