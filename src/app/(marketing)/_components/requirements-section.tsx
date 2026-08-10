import { CheckCircle2 } from "lucide-react";

import { requirementsContent } from "@/content/marketing";

export function RequirementsSection() {
  return (
    <section
      id={requirementsContent.id}
      className="scroll-mt-20 border-t border-border/60 bg-white/50"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <p className="text-sm font-medium text-primary">
          {requirementsContent.eyebrow}
        </p>
        <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-foreground">
          {requirementsContent.title}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
          {requirementsContent.intro}
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {requirementsContent.items.map((item) => (
            <li
              key={item.title}
              className="flex gap-3 rounded-2xl border border-border/70 bg-background/80 p-5"
            >
              <CheckCircle2
                className="mt-0.5 size-5 shrink-0 text-primary"
                aria-hidden
              />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-sm text-muted-foreground">
          {requirementsContent.disclaimerShort}
        </p>
      </div>
    </section>
  );
}
