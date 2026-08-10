import { Users } from "lucide-react";

import { PageHeaderCard } from "@/app/(app)/_components/page-header-card";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export const metadata = {
  title: "Users · BIR EIS",
};

export default async function UsersPage() {
  const session = await requirePermission("users.manage");

  const users = await prisma.user.findMany({
    where: { tenantId: session.user.tenantId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      userRoles: {
        include: { role: { select: { name: true } } },
      },
    },
  });

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeaderCard
        icon={<Users className="size-5" />}
        title="Users"
        description="People in your organization. Invite and role editing come later."
      />

      <div className="overflow-hidden rounded-2xl border-transparent bg-card shadow-[0_6px_22px_rgba(15,23,42,0.07)]">
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Roles</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No users found in this organization.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="px-4 py-3">{user.name || "—"}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.userRoles.map((ur) => ur.role.name).join(", ") || "—"}
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
