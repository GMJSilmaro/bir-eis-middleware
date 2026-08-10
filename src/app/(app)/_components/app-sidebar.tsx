"use client";

import type { ComponentProps } from "react";

import {
  appNavigation,
  filterNavByPermissions,
} from "@/config/app-navigation";
import { IntegratedPortalCard } from "@/app/(app)/_components/integrated-portal-card";
import { NavMain } from "@/app/(app)/_components/nav-main";
import { TeamSwitcher } from "@/app/(app)/_components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

interface AppSidebarProps extends ComponentProps<typeof Sidebar> {
  tenantName: string;
  tagline?: string | null;
  logo?: string | null;
  permissions: string[];
}

export function AppSidebar({
  tenantName,
  tagline,
  logo,
  permissions,
  ...props
}: AppSidebarProps) {
  const items = filterNavByPermissions(appNavigation, permissions);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher tenantName={tenantName} tagline={tagline} logo={logo} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>
      <SidebarFooter className="gap-0">
        <IntegratedPortalCard />
      </SidebarFooter>
    </Sidebar>
  );
}
