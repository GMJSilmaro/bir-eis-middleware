-- CreateTable
CREATE TABLE "erp_connections" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "base_url" TEXT,
    "username" TEXT,
    "secret_ciphertext" TEXT,
    "secret_last4" TEXT,
    "field_map" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "erp_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "erp_connections_tenant_id_idx" ON "erp_connections"("tenant_id");

-- AddForeignKey
ALTER TABLE "erp_connections" ADD CONSTRAINT "erp_connections_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
