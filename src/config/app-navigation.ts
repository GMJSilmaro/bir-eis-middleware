import {
  FileInput,
  FileOutput,
  History,
  LayoutDashboard,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavLinkItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: string;
}

export const appNavigation: NavLinkItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    permission: "dashboard.view",
  },
  {
    href: "/outbound",
    label: "Outbound",
    icon: FileOutput,
    permission: "documents.view",
  },
  {
    href: "/inbound",
    label: "Inbound",
    icon: FileInput,
    permission: "documents.view",
  },
  {
    href: "/compliance",
    label: "Compliance",
    icon: ShieldCheck,
    permission: "compliance.view",
  },
  {
    href: "/audit-log",
    label: "Audit Logs",
    icon: History,
    permission: "audit.view",
  },
  {
    href: "/users",
    label: "Users",
    icon: Users,
    permission: "users.manage",
  },
];

export function filterNavByPermissions(
  items: NavLinkItem[],
  permissions: string[],
): NavLinkItem[] {
  return items.filter((item) => {
    if (!item.permission) return true;
    return permissions.includes(item.permission);
  });
}
