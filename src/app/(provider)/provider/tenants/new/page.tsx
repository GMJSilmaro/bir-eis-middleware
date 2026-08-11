import { CreateTenantForm } from "@/features/provider/components/create-tenant-form";

export const metadata = {
  title: "New tenant · Provider · BIR EIS",
};

export default function ProviderNewTenantPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          New workspace
        </h1>
        <p className="text-sm text-muted-foreground">
          Create an organization and its first admin. Share the one-time
          password after creation.
        </p>
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <CreateTenantForm />
      </div>
    </div>
  );
}
