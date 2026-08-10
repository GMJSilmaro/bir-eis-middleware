"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { stepsContent } from "@/content/marketing";
import { cn } from "@/utils/cn";

export function MandateSteps() {
  const [activeId, setActiveId] = useState(stepsContent.steps[0]?.id ?? "");

  return (
    <section
      id={stepsContent.id}
      className="scroll-mt-20 border-t border-border/60"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
        <div className="flex flex-col justify-center gap-5">
          <p className="text-sm font-medium text-primary">
            {stepsContent.eyebrow}
          </p>
          <h2 className="max-w-md text-3xl font-semibold tracking-tight text-foreground">
            {stepsContent.title}
          </h2>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            {stepsContent.intro}
          </p>
          <div>
            <Button asChild>
              <Link href={stepsContent.cta.href}>{stepsContent.cta.label}</Link>
            </Button>
          </div>
        </div>

        <ol className="relative space-y-3">
          {stepsContent.steps.map((step, index) => {
            const isActive = step.id === activeId;
            const isLast = index === stepsContent.steps.length - 1;

            return (
              <li key={step.id} className="relative pl-12">
                {!isLast ? (
                  <span
                    aria-hidden
                    className="absolute top-10 -bottom-3 left-[1.15rem] w-px bg-border"
                  />
                ) : null}
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-3 left-0 flex size-9 items-center justify-center rounded-full border text-xs font-semibold",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground",
                  )}
                >
                  {step.number}
                </span>

                <button
                  type="button"
                  aria-expanded={isActive}
                  onClick={() => setActiveId(step.id)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-3.5 text-left transition-colors",
                    isActive
                      ? "border-primary/30 bg-primary/5 shadow-[0_2px_10px_rgba(15,23,42,0.05)]"
                      : "border-border/70 bg-background/70 hover:border-border hover:bg-accent/40",
                  )}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-sm font-semibold text-foreground">
                        {step.title}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {step.summary}
                      </span>
                    </span>
                    <ChevronDown
                      className={cn(
                        "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform",
                        isActive && "rotate-180 text-primary",
                      )}
                      aria-hidden
                    />
                  </span>
                  {isActive ? (
                    <span className="mt-3 block border-t border-border/60 pt-3 text-sm leading-relaxed text-foreground/90">
                      {step.detail}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
