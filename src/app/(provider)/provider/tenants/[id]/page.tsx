import Link from "next/link";
import { notFound } from "next/navigation";

import { DeactivateTenantButton } from "@/features/provider/components/deactivate-tenant-button";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/database/client";

export const metadata = {
  title: "Tenant detail · Provider · BIR EIS",
};

export default async function ProviderTenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      tagline: true,
      logo: true,
      createdAt: true,
      deletedAt: true,
      users: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        take: 50,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          userRoles: {
            include: { role: { select: { name: true, slug: true } } },
          },
        },
      },
      _count: {
        select: {
          users: { where: { deletedAt: null } },
        },
      },
    },
  });

  if (!tenant) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Workspace
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {tenant.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {tenant.tagline?.trim() || "No tagline set"}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/provider/tenants">All tenants</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Slug</p>
          <p className="mt-1 font-mono text-sm">{tenant.slug}</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Active users</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {tenant._count.users}
          </p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="mt-1 text-sm font-medium">
            {tenant.deletedAt ? (
              <span className="text-destructive">Deactivated</span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-300">
                Active
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Created{" "}
            {tenant.createdAt.toLocaleDateString("en-PH", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Users</h2>
          <Link
            href={`/login?tenant=${encodeURIComponent(tenant.slug)}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            Open branded sign-in
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Roles</th>
              </tr>
            </thead>
            <tbody>
              {tenant.users.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No active users.
                  </td>
                </tr>
              ) : (
                tenant.users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="px-4 py-3">{user.name || "—"}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.userRoles.map((ur) => ur.role.name).join(", ") ||
                        "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!tenant.deletedAt ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
          <h2 className="text-sm font-semibold text-destructive">Danger zone</h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Soft-deactivate this workspace. It will remain in the list but marked
            inactive.
          </p>
          <DeactivateTenantButton
            tenantId={tenant.id}
            tenantName={tenant.name}
          />
        </div>
      ) : null}
    </div>
  );
}
