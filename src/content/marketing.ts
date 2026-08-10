/**
 * Public landing / help copy for BIR EIS middleware.
 * Educational tone; product claims stay honest to what the portal ships today.
 */

export interface MarketingLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface MandateCard {
  title: string;
  body: string;
}

export interface MandateStep {
  id: string;
  number: string;
  title: string;
  summary: string;
  detail: string;
}

export interface RequirementItem {
  title: string;
  body: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const marketingNav = [
  { label: "Mandate", href: "/#mandate" },
  { label: "Steps", href: "/#steps" },
  { label: "Requirements", href: "/#requirements" },
  { label: "Help", href: "/#help" },
] as const;

export const heroContent = {
  eyebrow: "BIR EIS Middleware",
  title: "Electronic invoicing middleware for BIR EIS compliance",
  description:
    "Map ERP, manual, and API invoice data to BIR-ready JSON, sign with JWS, and transmit to EIS Cert or production—with multi-tenant access control built in.",
  primaryCta: { label: "Sign in", href: "/login" },
  secondaryCta: { label: "Create organization", href: "/register" },
} as const;

export const mandateContent = {
  id: "mandate",
  eyebrow: "The mandate explained",
  title: "Philippine e-invoicing under RR 11-2025",
  intro:
    "Covered taxpayers must issue electronic invoices and report electronic sales under the CREATE MORE framework. The first-wave electronic invoicing compliance deadline was extended to 31 December 2026 via RR 26-2025.",
  cards: [
    {
      title: "Transmission model",
      body: "Structured invoices move through BIR EIS / eSRS channels—not PDF or scanned images alone. Middleware helps prepare, queue, and track what you send.",
    },
    {
      title: "Formats that qualify",
      body: "BIR-oriented JSON documents with JWS digital signatures are the expected path. Paper-style files without structured data do not meet the electronic reporting bar.",
    },
    {
      title: "Who is typically covered",
      body: "Wave 1 often includes large taxpayers, e-commerce sellers, and CAS / CAS-related users as BIR designates. Later waves may expand—confirm with your RDO.",
    },
  ] satisfies MandateCard[],
  deadlineNote:
    "First-wave deadline: 31 December 2026. Exact coverage and timelines can shift with BIR issuances—verify against official sources.",
} as const;

export const stepsContent = {
  id: "steps",
  eyebrow: "Compliance path",
  title: "Five steps toward EIS-ready invoicing",
  intro:
    "Use this timeline as a practical guide. BIR EIS helps you organize drafts, credentials, and audit trails—while Certification and Permit to Transmit remain your responsibility as the taxpayer.",
  cta: { label: "Get started", href: "/register" },
  steps: [
    {
      id: "cas-readiness",
      number: "01",
      title: "CAS & readiness",
      summary:
        "Confirm Acknowledgement Certificate / CAS readiness before you rely on electronic issuance.",
      detail:
        "Industry primers stress readiness with your RDO and CAS process before go-live. This portal helps you organize invoice drafts and review status—it does not replace RDO consulting or CAS accreditation work.",
    },
    {
      id: "structured-prep",
      number: "02",
      title: "Structured invoice prep",
      summary:
        "Bring invoices in manually, from ERP sync, or Excel—and keep them as outbound drafts.",
      detail:
        "Create drafts by hand, pull sample invoices from a saved ERP connection, or upload a CSV template (up to 200 rows). Review and queue outbound documents before any live EIS send.",
    },
    {
      id: "eis-onboarding",
      number: "03",
      title: "EIS onboarding & PTT",
      summary:
        "Complete EIS Cert onboarding and obtain your Permit to Transmit—you own those credentials.",
      detail:
        "Store TIN, Cert/Prod environment, and PTT metadata in the credential vault. EIS Certification and PTT stay taxpayer obligations; the app is middleware, not a substitute for BIR accreditation of your organization.",
    },
    {
      id: "queue-window",
      number: "04",
      title: "Queue & reporting window",
      summary:
        "Prepare and queue submissions toward EIS; respect reporting timing once eSRS is live.",
      detail:
        "Industry guidance often cites a 3-day reporting window once ESRS is live. Today you can prepare and queue for submission; live HTTP transmit to BIR remains on the product roadmap.",
    },
    {
      id: "responses-audit",
      number: "05",
      title: "Responses & audit",
      summary:
        "Review EIS responses inbound and keep an audit trail for readiness checks.",
      detail:
        "Inbound responses and tenant-scoped audit logs help you see what was accepted, rejected, or updated—so reviews and handoffs stay traceable.",
    },
  ] satisfies MandateStep[],
} as const;

export const requirementsContent = {
  id: "requirements",
  eyebrow: "Requirements",
  title: "What you need for electronic invoicing",
  intro:
    "A short checklist for teams preparing for BIR EIS. Treat this as product orientation—not legal advice.",
  items: [
    {
      title: "Confirm you are in scope",
      body: "Wave 1 commonly covers large taxpayers, e-commerce sellers, and CAS-related users. Later waves may include exporters, incentivized firms, and POS-heavy taxpayers when BIR systems are ready.",
    },
    {
      title: "JSON + JWS documents",
      body: "Plan for structured JSON invoices and JWS (RS256) signatures on what you transmit. PDF or scans alone do not qualify as electronic reporting.",
    },
    {
      title: "Supported document types",
      body: "Commonly cited types include Sales Invoice, Official Receipt, Service Billing, and Debit/Credit Note (or Memo). Match the types your business actually issues.",
    },
    {
      title: "EIS Cert & Permit to Transmit",
      body: "Onboarding typically runs through EIS Cert testing capabilities, then your own Permit to Transmit. Store credentials securely in the portal vault; ownership stays with the taxpayer.",
    },
    {
      title: "Reporting window",
      body: "Once ESRS is live, industry guidance often cites about three days to report. Build process discipline around prepare → queue → confirm—even while live transmit matures.",
    },
    {
      title: "Retention",
      body: "Digital retention is often discussed around ~10 years, with printed backups commonly mentioned for early years. Verify retention against official RR text for your records policy.",
    },
  ] satisfies RequirementItem[],
  disclaimerShort:
    "This checklist is for orientation only. Confirm requirements with official BIR issuances and your RDO.",
} as const;

export const helpContent = {
  id: "help",
  eyebrow: "Help & Support",
  title: "Answers and official resources",
  intro:
    "Quick answers about how BIR EIS middleware fits the mandate, plus links to official portals.",
  faq: [
    {
      question: "Does this app replace my EIS Certification or PTT?",
      answer:
        "No. EIS Certification and Permit to Transmit are taxpayer responsibilities. BIR EIS stores credential metadata and helps you prepare, queue, and track documents—it does not claim vendor accreditation as an \"EIS provider.\"",
    },
    {
      question: "Can I create invoices without an ERP today?",
      answer:
        "Yes. You can create outbound drafts manually, sync sample invoices from a saved ERP connection (sandbox), or import a CSV template. Live ERP HTTP connectors and live EIS transmit are still on the roadmap.",
    },
    {
      question: "What is the first-wave deadline?",
      answer:
        "The first-wave electronic invoicing compliance deadline was extended to 31 December 2026 via RR 26-2025. Always re-check the latest BIR issuance for your wave.",
    },
    {
      question: "Where do I find official BIR systems?",
      answer:
        "Use BIR EIS for production and BIR EIS Cert for certification / testing. Links are listed below.",
    },
  ] satisfies FaqItem[],
  supportLinks: [
    {
      label: "support@bir-eis.example",
      href: "mailto:support@bir-eis.example",
      external: false,
    },
  ] satisfies MarketingLink[],
  officialLinks: [
    {
      label: "BIR EIS (production)",
      href: "https://eis.bir.gov.ph/#/main",
      external: true,
    },
    {
      label: "BIR EIS Cert",
      href: "https://eis-cert.bir.gov.ph/#/main",
      external: true,
    },
    {
      label: "RR No. 11-2025 (PDF)",
      href: "https://bir-cdn.bir.gov.ph/BIR/pdf/RR%20No.%2011-2025.pdf",
      external: true,
    },
  ] satisfies MarketingLink[],
} as const;

export const footerContent = {
  copyright: `© ${new Date().getFullYear()} BIR EIS. All rights reserved.`,
  disclaimer:
    "Regulatory summaries on this site are for product orientation only and are not legal or tax advice. Verify requirements with official BIR issuances and your RDO. EIS Certification and Permit to Transmit remain the taxpayer’s responsibility.",
} as const;
