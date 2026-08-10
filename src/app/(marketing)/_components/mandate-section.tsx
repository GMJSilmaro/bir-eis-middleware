import { mandateContent } from "@/content/marketing";

export function MandateSection() {
  return (
    <section
      id={mandateContent.id}
      className="scroll-mt-20 border-t border-border/60 bg-white/50"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <p className="text-sm font-medium text-primary">
          {mandateContent.eyebrow}
        </p>
        <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-foreground">
          {mandateContent.title}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
          {mandateContent.intro}
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {mandateContent.cards.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-border/70 bg-background/80 p-5 shadow-[0_1px_6px_rgba(15,23,42,0.04)]"
            >
              <h3 className="text-base font-semibold text-foreground">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {card.body}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-8 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-foreground/90">
          {mandateContent.deadlineNote}
        </p>
      </div>
    </section>
  );
}
