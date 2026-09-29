-- BIR EIS Setup Wizard orchestration + taxpayer profile extensions

ALTER TABLE "taxpayer_profiles" ADD COLUMN IF NOT EXISTS "trade_name" TEXT;
ALTER TABLE "taxpayer_profiles" ADD COLUMN IF NOT EXISTS "business_type" TEXT;
ALTER TABLE "taxpayer_profiles" ADD COLUMN IF NOT EXISTS "ecommerce_engaged" TEXT;
ALTER TABLE "taxpayer_profiles" ADD COLUMN IF NOT EXISTS "uses_cas" TEXT;

CREATE TABLE IF NOT EXISTS "eis_setup_states" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "current_step_key" TEXT NOT NULL DEFAULT 'organization',
    "wizard_started_at" TIMESTAMP(3),
    "reminder_dismissed_at" TIMESTAMP(3),
    "completion_acknowledged_at" TIMESTAMP(3),
    "requires_revalidation" BOOLEAN NOT NULL DEFAULT false,
    "revalidation_reason" TEXT,
    "discovery_result" JSONB,
    "discovery_at" TIMESTAMP(3),
    "quality_scan_result" JSONB,
    "quality_scan_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eis_setup_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "eis_setup_states_tenant_id_key" ON "eis_setup_states"("tenant_id");

DO $$ BEGIN
  ALTER TABLE "eis_setup_states"
    ADD CONSTRAINT "eis_setup_states_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
