import { Users } from "lucide-react";

import { PageHeaderCard } from "@/app/(app)/_components/page-header-card";
import { CreateUserDialog } from "@/features/users/components/create-user-dialog";
import { UsersTable } from "@/features/users/components/users-table";
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
        include: { role: { select: { name: true, slug: true, deletedAt: true } } },
      },
    },
  });

  const rows = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    roleSlugs: user.userRoles
      .filter((ur) => ur.role.deletedAt == null)
      .map((ur) => ur.role.slug),
  }));

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeaderCard
        icon={<Users className="size-5" />}
        title="Users"
        description="Create accounts, change roles, and deactivate people in your organization."
        aside={<CreateUserDialog />}
      />

      <UsersTable users={rows} currentUserId={session.user.id} />
    </div>
  );
}
