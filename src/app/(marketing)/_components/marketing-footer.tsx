import { footerContent } from "@/content/marketing";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/70 bg-background/90">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8">
        <p className="text-sm text-muted-foreground">{footerContent.copyright}</p>
        <p className="max-w-4xl text-xs leading-relaxed text-muted-foreground">
          {footerContent.disclaimer}
        </p>
      </div>
    </footer>
  );
}
