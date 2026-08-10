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
    version: "0.6.0",
    date: "2026-08-10",
    releasedAt: "2026-08-10T21:00:00+08:00",
    title: "Learn the mandate, steps, and requirements on the home page",
    highlights: [
      "The public home page now explains the BIR e-invoicing mandate, a clear five-step path, and what you need to prepare",
      "Help & Support answers common questions and links to official BIR EIS portals",
      "From your account menu, jump straight to Requirements or Help & Support on the home page",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Home page sections cover the mandate (RR 11-2025 / Dec 2026 wave), an interactive compliance steps timeline, a requirements checklist, and Help & Support with FAQ plus official BIR links",
      },
      {
        type: "feature",
        description:
          "Account menus include Help & Support and Requirements so you can open those home-page sections without hunting for them",
      },
      {
        type: "improvement",
        description:
          "Landing navigation anchors make it easy to move between Mandate, Steps, Requirements, and Help while staying on the same page",
      },
    ],
  },

  {
    version: "0.5.0",
    date: "2026-08-10",
    releasedAt: "2026-08-10T20:00:00+08:00",
    title: "Bring invoices in from ERP or Excel",
    highlights: [
      "Connect your ERP under Settings and pull sample invoices into Outbound drafts",
      "Download a ready-made CSV template, upload filled rows, and create many drafts at once",
      "New document opens ERP Sync or Excel right in the chooser—no need to leave Outbound",
      "Duplicate document numbers are skipped with clear per-row feedback",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Settings → Integrations lets you save ERP connections (provider, URL, username, encrypted secret) and run a sandbox connection check",
      },
      {
        type: "feature",
        description:
          "ERP Sync pulls sample invoices from a saved connection and creates outbound drafts you can review and queue",
      },
      {
        type: "feature",
        description:
          "Excel import downloads a BIR-aligned CSV template and uploads up to 200 rows to create outbound drafts in bulk",
      },
      {
        type: "improvement",
        description:
          "The New document chooser marks Manual, ERP Sync, and Excel as Available now; ERP Sync and Excel open in the same popup so you stay on Outbound",
      },
      {
        type: "improvement",
        description:
          "Create options use white cards with a soft navy icon chip, navy Available now badges, a light navy border that deepens on hover, and a gentle lift",
      },
      {
        type: "improvement",
        description:
          "Import and sync results show how many drafts were created, skipped as duplicates, or need a fix",
      },
    ],
  },

  {
    version: "0.4.3",
    date: "2026-08-10",
    releasedAt: "2026-08-10T19:40:00+08:00",
    title: "Choose how to create outbound documents",
    highlights: [
      "New document opens a chooser for Manual, ERP Sync, or Excel",
      "Manual is marked Available now so it is clear which option you can use today",
      "Coming soon options look distinct while more create methods stay on the roadmap",
      "Create outbound document popup stays centered and fully visible on screen",
    ],
    changes: [
      {
        type: "feature",
        description:
          "On Outbound, New document opens a popup so you can pick Manual entry, ERP Sync, or Excel File",
      },
      {
        type: "improvement",
        description:
          "Chooser cards feel fuller and more polished, with Manual marked Available now and a gentle lift on hover",
      },
      {
        type: "improvement",
        description:
          "ERP Sync and Excel File stay marked Coming soon so it is obvious they are not ready yet",
      },
      {
        type: "fix",
        description:
          "The create outbound document popup is centered on screen again and scrolls if needed so it is not cut off",
      },
    ],
  },
  {
    version: "0.4.2",
    date: "2026-08-10",
    releasedAt: "2026-08-10T18:55:00+08:00",
    title: "Clearer lists, filters, and header actions",

    highlights: [
      "Search and status filters sit together in one solid card",
      "Primary actions use a consistent pill-shaped button",
      "Header Back and Open actions stay readable on the navy banner",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Outbound and Inbound filters—search, document type, and status—appear in a single solid card instead of split rows",
      },
      {
        type: "improvement",
        description:
          "New document, Sync from EIS, and other primary actions share the same pill-shaped style",
      },
      {
        type: "improvement",
        description:
          "Document and audit lists use the same table layout with clearer paging controls",
      },
      {
        type: "fix",
        description:
          "Buttons on the navy page header stay readable when you hover or tap them",
      },
    ],
  },
  {
    version: "0.4.1",
    date: "2026-08-10",
    releasedAt: "2026-08-10T18:45:00+08:00",
    title: "EIS response inbox and clearer document lists",
    highlights: [
      "Inbound now shows BIR EIS replies for your outbound submissions",
      "Sync from EIS refreshes pending sandbox responses in one click",
      "Document tables add View details, search, type filters, and always-on paging",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Inbound is the EIS response inbox for queued and submitted outbound documents, with Sync from EIS for sandbox refresh",
      },
      {
        type: "improvement",
        description:
          "Outbound and Inbound lists include View details actions, search by number or counterpart, document type filters, and clearer pagination",
      },
      {
        type: "improvement",
        description:
          "Labels say EIS response instead of acknowledgement jargon, and primary actions sit on the right",
      },
      {
        type: "fix",
        description:
          "Dashboard inbound total counts received EIS accept or reject replies, not buyer purchase documents",
      },
    ],
  },
  {
    version: "0.4.0",
    date: "2026-08-10",
    releasedAt: "2026-08-10T18:30:00+08:00",
    title: "Outbound and inbound document inbox",
    highlights: [
      "Prepare outbound invoices and receipts, then queue them before transmit",
      "Record inbound buyer documents and mark them as reviewed",
      "Track accept or reject acknowledgements on outbound documents",
      "Dashboard totals now reflect your real outbound and inbound counts",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Outbound inbox lets you create draft sales documents, edit them, and queue them for later transmission",
      },
      {
        type: "feature",
        description:
          "Inbound inbox lets you record buyer documents and mark received items as reviewed",
      },
      {
        type: "feature",
        description:
          "Outbound documents can store simulated EIS accept or reject acknowledgements with a reference and message",
      },
      {
        type: "improvement",
        description:
          "Dashboard outbound and inbound totals, status mix, and top counterparts use your live document data when available",
      },
      {
        type: "improvement",
        description:
          "Outbound and Inbound appear in the sidebar for people who can view documents",
      },
    ],
  },
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
