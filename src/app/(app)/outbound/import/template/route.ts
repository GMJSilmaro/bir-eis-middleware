import { buildOutboundCsvTemplate } from "@/features/documents/lib/bir-portal-field-map";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET() {
  await requirePermission("documents.manage");

  const body = buildOutboundCsvTemplate();

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="bir-eis-outbound-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}
