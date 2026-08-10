import Link from "next/link";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";

import { PageHeaderCard } from "@/app/(app)/_components/page-header-card";
import { DocumentContentCard } from "@/features/documents/components/document-content-card";
import { ExcelImportPanel } from "@/features/documents/components/excel-import-panel";
import { requirePermission } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Import Excel · Outbound · BIR EIS",
};

export default async function OutboundImportPage() {
  await requirePermission("documents.manage");

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeaderCard
        icon={<FileSpreadsheet className="size-5" />}
        title="Import from Excel"
        description="Download the BIR/portal CSV template, fill your rows, and create outbound drafts in bulk."
        aside={
          <Button asChild variant="onNavyOutline">
            <Link href="/outbound">
              <ArrowLeft className="size-4" />
              Back to Outbound
            </Link>
          </Button>
        }
      />

      <DocumentContentCard
        title="CSV import"
        description="Use the exact column headers from the template. Success and duplicate skips show as toasts; other row issues appear below."
      >
        <ExcelImportPanel />
      </DocumentContentCard>
    </div>
  );
}
