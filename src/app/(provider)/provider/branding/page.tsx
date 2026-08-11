import { PlatformBrandingForm } from "@/features/provider/components/platform-branding-form";
import { getPlatformSettings } from "@/features/provider/lib/get-platform-settings";

export const metadata = {
  title: "Branding · Provider · BIR EIS",
};

export default async function ProviderBrandingPage() {
  const settings = await getPlatformSettings();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Sign-in branding
        </h1>
        <p className="text-sm text-muted-foreground">
          Product name, tagline, and logo shown on the login page when no
          tenant-specific overlay is active.
        </p>
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <PlatformBrandingForm
          initial={{
            productName: settings.productName,
            productTagline: settings.productTagline,
            logo: settings.logo ?? "",
          }}
        />
      </div>
    </div>
  );
}
