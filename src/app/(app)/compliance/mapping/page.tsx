import { FieldMappingEditor } from "@/features/compliance/components/field-mapping-editor";
import { SettingsContentCard } from "@/features/settings/components/settings-content-card";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/client";

export default async function ComplianceMappingPage() {
  const session = await requirePermission("compliance.view");
  const tenantId = session.user.tenantId;
  const canEdit = hasPermission(
    session.user.permissions,
    "compliance.mapping.edit",
  );

  const connections = await prisma.erpConnection.findMany({
    where: { tenantId, deletedAt: null },
    include: { fieldMappings: { orderBy: { canonicalField: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <SettingsContentCard
      title="Field mapping"
      description="ERP field → canonical middleware field → BIR EIS field. Production activation is blocked while required fields remain unmapped."
    >
      {connections.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add an ERP connection under Settings before configuring mappings.
        </p>
      ) : (
        <div className="space-y-8">
          {connections.map((c) => (
            <FieldMappingEditor
              key={c.id}
              canEdit={canEdit}
              connectionId={c.id}
              connectionName={c.name}
              initialRows={c.fieldMappings.map((m) => ({
                id: m.id,
                erpField: m.erpField,
                canonicalField: m.canonicalField,
                eisField: m.eisField ?? "",
                required: m.required,
              }))}
            />
          ))}
        </div>
      )}
    </SettingsContentCard>
  );
}
