"use client";

import { ChevronsUpDown, GalleryVerticalEnd } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface TeamSwitcherProps {
  tenantName: string;
  tagline?: string | null;
  logo?: string | null;
}

function OrgMark({
  logo,
  sizeClassName,
  iconClassName,
}: {
  logo?: string | null;
  sizeClassName: string;
  iconClassName: string;
}) {
  if (logo?.trim()) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg ${sizeClassName}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- tenant logo may be data URL or external */}
        <img src={logo} alt="" className="size-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground ${sizeClassName}`}
    >
      <GalleryVerticalEnd className={iconClassName} />
    </div>
  );
}

export function TeamSwitcher({
  tenantName,
  tagline,
  logo,
}: TeamSwitcherProps) {
  const { isMobile } = useSidebar();
  const description = tagline?.trim() || "Organization";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center"
            >
              <OrgMark
                logo={logo}
                sizeClassName="aspect-square size-9"
                iconClassName="size-4.5"
              />
              <div className="grid min-w-0 flex-1 text-left text-[15px] leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold text-sidebar-foreground">
                  {tenantName}
                </span>
                <span className="truncate text-[13px] text-sidebar-muted">
                  {description}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto shrink-0 text-sidebar-muted group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organization
            </DropdownMenuLabel>
            <DropdownMenuItem className="gap-2 p-2" disabled>
              <OrgMark
                logo={logo}
                sizeClassName="size-6 rounded-md border"
                iconClassName="size-3.5 shrink-0"
              />
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">{tenantName}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
