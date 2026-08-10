import Link from "next/link";
import { ArrowLeft, FileOutput } from "lucide-react";

import { PageHeaderCard } from "@/app/(app)/_components/page-header-card";
import { DocumentContentCard } from "@/features/documents/components/document-content-card";
import { OutboundDocumentForm } from "@/features/documents/components/outbound-document-form";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth/permissions";

export const metadata = {
  title: "New outbound document · BIR EIS",
};

export default async function NewOutboundDocumentPage() {
  await requirePermission("documents.manage");

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeaderCard
        icon={<FileOutput className="size-5" />}
        title="New outbound document"
        description="Create a draft sales document. You can queue it when you are ready."
        aside={
          <Button asChild variant="onNavyOutline">
            <Link href="/outbound">
              <ArrowLeft className="size-4" />
              Back to list
            </Link>
          </Button>
        }
      />

      <DocumentContentCard
        title="Document details"
        description="Header amounts are enough for this MVP—line items can come later."
      >
        <OutboundDocumentForm mode="create" />
      </DocumentContentCard>
    </div>
  );
}
