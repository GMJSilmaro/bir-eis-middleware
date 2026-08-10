-- CreateTable
CREATE TABLE "invoice_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "document_number" TEXT NOT NULL,
    "issue_date" DATE NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "counterpart_name" TEXT NOT NULL,
    "counterpart_tin" TEXT,
    "line_extension_amount" DECIMAL(18,2) NOT NULL,
    "tax_amount" DECIMAL(18,2) NOT NULL,
    "total_amount" DECIMAL(18,2) NOT NULL,
    "line_items" JSONB,
    "eis_reference_id" TEXT,
    "eis_ack_status" TEXT,
    "eis_ack_message" TEXT,
    "eis_ack_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "invoice_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoice_documents_tenant_id_direction_created_at_idx" ON "invoice_documents"("tenant_id", "direction", "created_at");

-- CreateIndex
CREATE INDEX "invoice_documents_tenant_id_status_idx" ON "invoice_documents"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "invoice_documents_tenant_id_direction_document_number_idx" ON "invoice_documents"("tenant_id", "direction", "document_number");

-- AddForeignKey
ALTER TABLE "invoice_documents" ADD CONSTRAINT "invoice_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_documents" ADD CONSTRAINT "invoice_documents_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
