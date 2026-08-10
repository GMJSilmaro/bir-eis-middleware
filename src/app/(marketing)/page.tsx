import { HelpSupportSection } from "@/app/(marketing)/_components/help-support-section";
import { MandateSection } from "@/app/(marketing)/_components/mandate-section";
import { MandateSteps } from "@/app/(marketing)/_components/mandate-steps";
import { MarketingFooter } from "@/app/(marketing)/_components/marketing-footer";
import { MarketingHeader } from "@/app/(marketing)/_components/marketing-header";
import { MarketingHero } from "@/app/(marketing)/_components/marketing-hero";
import { RequirementsSection } from "@/app/(marketing)/_components/requirements-section";

export default function MarketingPage() {
  return (
    <div className="flex min-h-full flex-col bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_55%),hsl(var(--background))]">
      <MarketingHeader />
      <main className="flex-1">
        <MarketingHero />
        <MandateSection />
        <MandateSteps />
        <RequirementsSection />
        <HelpSupportSection />
      </main>
      <MarketingFooter />
    </div>
  );
}
