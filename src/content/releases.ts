/**
 * Release history for in-app "What's New" and update logs.
 *
 * Maintenance (each release):
 * 1. Bump `version` in package.json AND README "Current version" to match the newest entry
 * 2. Prepend a new entry below (newest first) with matching version, date, title, highlights,
 *    and typed changes (feature | improvement | fix)
 * 3. Set `releasedAt` (ISO datetime, Asia/Manila +08:00) on the latest entry for ship clock time
 * 4. Deploy — login footer and What's new dialog update automatically
 *
 * Semver / when to bump (do NOT dump unrelated work into one mega note):
 * - patch (x.y.Z): fixes, polish, small UX tweaks
 * - minor (x.Y.0): new core modules or capabilities — each distinct core module gets its OWN version
 * - major (X.0.0): breaking product changes (rare)
 *
 * Same-day consolidation:
 * - ONLY consolidate when changes share the same patch theme
 * - NEVER consolidate a new core module into an existing patch or unrelated core feature
 *
 * Writing style (always — end users, not developers):
 * - Describe what people can do or what feels better
 * - No file names, SQL, schema fields, migration names, or RBAC jargon dumps
 * - Keep highlights short; order changes as feature → improvement → fix
 */

export type ReleaseChangeType = "feature" | "improvement" | "fix";

export interface ReleaseChange {
  type: ReleaseChangeType;
  description: string;
}

export interface ReleaseNote {
  version: string;
  /** Calendar date (YYYY-MM-DD). Used for sorting/display when `releasedAt` is absent. */
  date: string;
  /**
   * Optional ISO datetime of the ship/push moment (e.g. 2026-08-10T16:00:00+08:00).
   * What's New shows clock time when set; older entries without it fall back to date-only.
   */
  releasedAt?: string;
  title: string;
  highlights: string[];
  changes?: ReleaseChange[];
}

export const RELEASES: ReleaseNote[] = [
  {
    version: "0.3.3",
    date: "2026-08-10",
    releasedAt: "2026-08-10T18:10:00+08:00",
    title: "Manage your account in Settings",
    highlights: [
      "Upload a profile photo under Personal Information",
      "Update your name and change your sign-in password",
      "Settings opens to Account first, with a solid side menu",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Personal Information lets you upload, replace, or remove a profile photo that appears in your account menu",
      },
      {
        type: "feature",
        description:
          "Personal Information lets you update your display name while keeping email and role easy to see",
      },
      {
        type: "feature",
        description:
          "Change Password verifies your current password and guides you with live strength requirements",
      },
      {
        type: "improvement",
        description:
          "Settings starts on your account, with Account, Workspace, and BIR EIS sections in the side menu",
      },
      {
        type: "fix",
        description:
          "Settings side menu and dropdown lists stay solid and easy to read over the page background",
      },
    ],
  },
  {
    version: "0.3.2",
    date: "2026-08-10",
    releasedAt: "2026-08-10T18:05:00+08:00",
    title: "Upload your organization logo",
    highlights: [
      "Upload a logo from Settings—PNG, JPG, WebP, or SVG",
      "Your logo appears in the sidebar next to your company name",
      "You can still paste a logo URL if you host it elsewhere",
      "Settings feels tighter and easier to scan, with less empty space between fields",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Organization settings lets you upload a logo file with a live preview before saving",
      },
      {
        type: "improvement",
        description:
          "The sidebar shows your uploaded logo beside your company name and tagline",
      },
      {
        type: "improvement",
        description:
          "Settings pages feel more polished with clearer fields, a solid side menu panel, and consistent save actions",
      },
      {
        type: "improvement",
        description:
          "Settings layout and forms use tighter spacing so the menu and content sit closer together",
      },
      {
        type: "fix",
        description:
          "Settings menu items no longer show clipped borders or uneven pill shapes",
      },
      {
        type: "fix",
        description:
          "EIS environment and PTT status dropdowns no longer look transparent or mismatched when opened",
      },
    ],
  },
  {
    version: "0.3.1",
    date: "2026-08-10",
    releasedAt: "2026-08-10T17:55:00+08:00",
    title: "Clearer Settings layout",
    highlights: [
      "Settings now opens one section at a time with a simple side menu",
      "Jump between Organization and EIS credentials without scrolling a long page",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Settings uses a side menu so you can focus on Organization or EIS credentials one section at a time",
      },
    ],
  },
  {
    version: "0.3.0",
    date: "2026-08-10",
    releasedAt: "2026-08-10T17:50:00+08:00",
    title: "Organization settings and activity trail",
    highlights: [
      "Update your company name, tagline, and logo from Settings",
      "See your company name and tagline in the sidebar workspace switcher",
      "Store BIR EIS credentials securely—TIN, environment, PTT details, and an API key that stays masked after save",
      "Review recent workspace changes on Audit Logs",
      "Open Users from the sidebar to see who belongs to your organization",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Settings lets admins update company name, tagline, and logo for your workspace",
      },
      {
        type: "feature",
        description:
          "Settings includes an EIS credential vault for TIN, Cert vs Production, PTT status, and an encrypted API key shown only as a masked ending after save",
      },
      {
        type: "feature",
        description:
          "Audit Logs lists recent organization and credential changes with who made them and when",
      },
      {
        type: "improvement",
        description:
          "The sidebar shows your company name as the main title and your tagline underneath",
      },
      {
        type: "improvement",
        description:
          "Users appears in the sidebar so admins can open the team list without hunting for it",
      },
      {
        type: "improvement",
        description:
          "Settings, Users, and Audit Logs share the same navy overview banner as the home dashboard",
      },
      {
        type: "fix",
        description:
          "Audit Logs and Users show the correct section title in the top bar",
      },
    ],
  },
  {
    version: "0.2.2",
    date: "2026-08-10",
    releasedAt: "2026-08-10T17:50:00+08:00",
    title: "Home analytics overview",
    highlights: [
      "Home opens with a Dashboard Overview: live clock, outbound and inbound totals, and companies at a glance",
      "See invoice status mix, top customers in pesos, and a BIR EIS system status panel with a refresh control",
      "The top bar shows your current section, then the version and release date—tap to open What’s new",
      "What’s new change labels stay compact chips beside each note",
      "Dashboard banners and card headers use a lighter navy gradient so monitoring panels feel clearer",
      "The Create Invoice preview is gone so the home screen stays focused on monitoring",
      "Sidebar brand and Platform menu icons and labels read a bit larger, and the sidebar toggle sits closer to the edge",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Home shows an analytics-style overview with summary totals, status distribution, top customers, and BIR EIS system status",
      },
      {
        type: "feature",
        description:
          "Version in the top bar opens What’s new so you can review release notes without leaving your workspace",
      },
      {
        type: "improvement",
        description:
          "Top bar shows a compact section label (Dashboard, Outbound, Inbound, and more) before the version so the header doesn’t feel empty",
      },
      {
        type: "improvement",
        description:
          "Release date appears beside the version badge in the top bar so you can see when the build shipped",
      },
      {
        type: "improvement",
        description:
          "Dashboard banners and card headers use a lighter navy gradient with soft accents instead of flat dark panels",
      },
      {
        type: "improvement",
        description:
          "Page overview banners (title, short description, and live clock) can be reused on other workspace screens",
      },
      {
        type: "improvement",
        description:
          "Sidebar brand mark and Platform menu icons and labels are slightly larger for easier scanning",
      },
      {
        type: "improvement",
        description:
          "Sidebar collapse stays on the header button only—the edge hover toggle is removed",
      },
      {
        type: "fix",
        description:
          "What’s new New / Improved / Fixed labels stay neat chips next to each note instead of tall colored blocks",
      },
      {
        type: "fix",
        description:
          "Removed the duplicate page title beside the sidebar button so the overview banner carries the heading instead",
      },
      {
        type: "fix",
        description:
          "Removed the Create Invoice preview and “nothing is stored” helper copy from home",
      },
      {
        type: "fix",
        description:
          "Sidebar toggle sits closer to the content edge with less empty space on the left",
      },
      {
        type: "fix",
        description:
          "Dashboard Overview banner loads reliably without an unexpected page error",
      },
    ],
  },
  {
    version: "0.2.1",
    date: "2026-08-10",
    releasedAt: "2026-08-10T17:15:00+08:00",
    title: "Refreshed workspace look",
    highlights: [
      "Home matches a cleaner invoice-management layout: title and search in one header, roomier totals, and clearer list and create panels",
      "Dashboard cards, totals, and the client list feel more modern—softer shadows, clearer labels, and cleaner action buttons",
      "The sidebar uses a clearer navy look with larger menu labels, and a more prominent Integrated Portal card while your main workspace stays light and easy to read",
      "Header search is typeable, the bell shows sample alerts, and collapsing the sidebar keeps icons tidy without clipped labels",
      "Create on the demo form reminds you that saving invoices comes in a later release—nothing is stored yet",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Home screen shows sample invoice totals, a client invoice list, and a create-invoice preview so you can explore the layout before live drafting ships",
      },
      {
        type: "feature",
        description:
          "Notification bell shows a sample count and a short preview list so you can see how alerts will look",
      },
      {
        type: "improvement",
        description:
          "Header puts the page title beside search, notifications, and your account avatar for a cleaner scan",
      },
      {
        type: "improvement",
        description:
          "Invoice totals, client list, and create form look more polished with softer cards, clearer captions, and primary action buttons",
      },
      {
        type: "improvement",
        description:
          "Workspace colors feel clearer: navy sidebar navigation with a light blue and white content area",
      },
      {
        type: "improvement",
        description:
          "Sidebar includes a more prominent Integrated Portal card when expanded, and hides it neatly when the menu collapses to icons",
      },
      {
        type: "improvement",
        description:
          "Platform menu icons and labels are larger and easier to read; Settings stays in your account menu instead of the main nav",
      },
      {
        type: "improvement",
        description:
          "Header search and spacing feel more open so the home screen is easier to scan",
      },
      {
        type: "fix",
        description:
          "You can type in the header search, and it filters the demo client invoice list as you go",
      },
      {
        type: "fix",
        description:
          "Collapsing the sidebar keeps icons centered and fully visible without leftover label slivers",
      },
    ],
  },
  {
    version: "0.2.0",
    date: "2026-08-10",
    releasedAt: "2026-08-10T16:50:00+08:00",
    title: "Secure workspace foundation",
    highlights: [
      "Sign in to your organization with email and password, and create a new organization when you need one",
      "Move around with a collapsible sidebar—organization switcher, platform links, and your account menu",
      "Open a clear home dashboard with stubs for outbound invoices, inbound documents, and team access",
      "See what’s new from the version label on sign-in so updates stay easy to find",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Sign in with your work email, or register a new organization and land on your workspace home",
      },
      {
        type: "feature",
        description:
          "Dashboard shows placeholder cards for outbound invoices, inbound documents, and users while EIS submission tools are prepared",
      },
      {
        type: "improvement",
        description:
          "Workspace sidebar matches the standard layout: organization switcher, platform links, and an account menu with log out",
      },
      {
        type: "improvement",
        description:
          "Workspace navigation collapses to icons on desktop and opens as a slide-out menu on phones",
      },
      {
        type: "improvement",
        description:
          "App shell and navigation make it easier to move between home, settings, and team areas",
      },
      {
        type: "fix",
        description:
          "Product name and version now show correctly instead of the temporary starter-app labels",
      },
    ],
  },
];
