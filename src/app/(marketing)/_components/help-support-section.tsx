import Link from "next/link";
import { ExternalLink, Mail } from "lucide-react";

import { helpContent, type MarketingLink } from "@/content/marketing";

function SupportLink({ link }: { link: MarketingLink }) {
  const isMail = link.href.startsWith("mailto:");
  const className =
    "inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline";

  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {link.label}
        <ExternalLink className="size-3.5" aria-hidden />
      </a>
    );
  }

  if (isMail) {
    return (
      <a href={link.href} className={className}>
        <Mail className="size-3.5" aria-hidden />
        {link.label}
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

export function HelpSupportSection() {
  return (
    <section
      id={helpContent.id}
      className="scroll-mt-20 border-t border-border/60"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <p className="text-sm font-medium text-primary">{helpContent.eyebrow}</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-foreground">
          {helpContent.title}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
          {helpContent.intro}
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Frequently asked
            </h3>
            <ul className="space-y-3">
              {helpContent.faq.map((item) => (
                <li
                  key={item.question}
                  className="rounded-2xl border border-border/70 bg-background/80 p-5"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {item.question}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.answer}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <aside className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Contact
              </h3>
              <ul className="mt-3 space-y-2">
                {helpContent.supportLinks.map((link) => (
                  <li key={link.href}>
                    <SupportLink link={link} />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Official BIR links
              </h3>
              <ul className="mt-3 space-y-2">
                {helpContent.officialLinks.map((link) => (
                  <li key={link.href}>
                    <SupportLink link={link} />
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
