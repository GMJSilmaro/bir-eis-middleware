import { requireAuth } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";
import { AppHeader } from "@/app/(app)/_components/app-header";
import { AppSearchProvider } from "@/app/(app)/_components/app-search-context";
import { AppSidebar } from "@/app/(app)/_components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  const tenant = await prisma.tenant.findFirst({
    where: { id: session.user.tenantId, deletedAt: null },
    select: { name: true, tagline: true, logo: true },
  });

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar
        tenantName={tenant?.name ?? "Workspace"}
        tagline={tenant?.tagline}
        logo={tenant?.logo}
        permissions={session.user.permissions}
      />
      <SidebarInset className="bg-background">
        <AppSearchProvider>
          <AppHeader
            userName={session.user.name ?? "User"}
            userEmail={session.user.email ?? ""}
            userImage={session.user.image ?? null}
            isPlatformOperator={session.user.isPlatformOperator}
          />
          <div className="flex flex-1 flex-col px-4 pb-8 sm:px-6 lg:px-8">
            <div className="w-full">{children}</div>
          </div>
        </AppSearchProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
