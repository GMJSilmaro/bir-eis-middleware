import {
  Building2,
  KeyRound,
  Lock,
  UserCog,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface SettingsNavItem {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface SettingsNavGroup {
  label: string;
  /** Optional group header icon (e.g. Account Settings). */
  icon?: LucideIcon;
  items: SettingsNavItem[];
}

export const settingsNavigation: SettingsNavGroup[] = [
  {
    label: "Account Settings",
    icon: UserCog,
    items: [
      {
        href: "/settings/profile",
        title: "Personal Information",
        description: "Photo, name, email, and role",
        icon: UserRound,
      },
      {
        href: "/settings/password",
        title: "Change Password",
        description: "Update your sign-in password",
        icon: Lock,
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        href: "/settings/organization",
        title: "Organization",
        description: "Name and branding",
        icon: Building2,
      },
    ],
  },
  {
    label: "E-Invoice / BIR EIS",
    items: [
      {
        href: "/settings/eis-credentials",
        title: "EIS credentials",
        description: "TIN, PTT, and API key",
        icon: KeyRound,
      },
    ],
  },
];
