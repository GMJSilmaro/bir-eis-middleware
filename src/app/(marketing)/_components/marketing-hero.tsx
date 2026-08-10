import Link from "next/link";

import { Button } from "@/components/ui/button";
import { heroContent } from "@/content/marketing";

export function MarketingHero() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-20 sm:py-24">
      <p className="text-sm font-medium text-primary">{heroContent.eyebrow}</p>
      <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        {heroContent.title}
      </h1>
      <p className="max-w-2xl text-lg text-muted-foreground">
        {heroContent.description}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button size="lg" asChild>
          <Link href={heroContent.primaryCta.href}>
            {heroContent.primaryCta.label}
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href={heroContent.secondaryCta.href}>
            {heroContent.secondaryCta.label}
          </Link>
        </Button>
      </div>
    </section>
  );
}
