import { requireAuth } from "@/lib/auth/permissions";

export const metadata = {
  title: "Outbound · BIR EIS",
};

export default async function OutboundPage() {
  await requireAuth();

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Outbound invoice preparation and EIS transmission will land in a later
        release.
      </p>
    </div>
  );
}
