import { requirePlatformOperator } from "@/lib/auth/permissions";
import { ProviderNav } from "@/app/(provider)/provider/_components/provider-nav";

export default async function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformOperator();

  return (
    <div className="min-h-dvh bg-background">
      <ProviderNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
