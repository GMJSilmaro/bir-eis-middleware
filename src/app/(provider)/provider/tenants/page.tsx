import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/database/client";

export const metadata = {
  title: "Tenants · Provider · BIR EIS",
};

export default async function ProviderTenantsPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      tagline: true,
      createdAt: true,
      deletedAt: true,
      _count: {
        select: {
          users: { where: { deletedAt: null } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Tenants</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage organization workspaces.
          </p>
        </div>
        <Button asChild>
          <Link href="/provider/tenants/new">
            <Plus className="size-4" />
            New workspace
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Organization</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Users</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {tenants.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No workspaces yet. Create the first one.
                </td>
              </tr>
            ) : (
              tenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/provider/tenants/${tenant.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {tenant.name}
                    </Link>
                    {tenant.tagline ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {tenant.tagline}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {tenant.slug}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {tenant._count.users}
                  </td>
                  <td className="px-4 py-3">
                    {tenant.deletedAt ? (
                      <span className="text-destructive">Deactivated</span>
                    ) : (
                      <span className="text-emerald-700 dark:text-emerald-300">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {tenant.createdAt.toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
