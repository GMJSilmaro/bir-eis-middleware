import { requireAuth } from "@/lib/auth/permissions";

export const metadata = {
  title: "Inbound · BIR EIS",
};

export default async function InboundPage() {
  await requireAuth();

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Inbound document tracking will land in a later release.
      </p>
    </div>
  );
}
