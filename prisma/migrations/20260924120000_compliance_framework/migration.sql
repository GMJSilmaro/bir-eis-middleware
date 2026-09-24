-- Compliance Onboarding & Readiness Framework

-- Audit log extensions
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "previous_state" JSONB;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "new_state" JSONB;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "reason" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "correlation_id" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "ip_address" TEXT;
CREATE INDEX IF NOT EXISTS "audit_logs_tenant_id_correlation_id_idx" ON "audit_logs"("tenant_id", "correlation_id");

-- Invoice document extensions
ALTER TABLE "invoice_documents" ADD COLUMN IF NOT EXISTS "source_erp_id" TEXT;
ALTER TABLE "invoice_documents" ADD COLUMN IF NOT EXISTS "validation_status" TEXT;
ALTER TABLE "invoice_documents" ADD COLUMN IF NOT EXISTS "failure_class" TEXT;
ALTER TABLE "invoice_documents" ADD COLUMN IF NOT EXISTS "seller_branch_code" TEXT;
CREATE INDEX IF NOT EXISTS "invoice_documents_tenant_id_source_erp_id_idx" ON "invoice_documents"("tenant_id", "source_erp_id");
CREATE INDEX IF NOT EXISTS "invoice_documents_tenant_id_validation_status_idx" ON "invoice_documents"("tenant_id", "validation_status");

-- Soft-delete-aware unique invoice numbers (active rows only)
CREATE UNIQUE INDEX IF NOT EXISTS "invoice_documents_tenant_direction_number_active_uidx"
  ON "invoice_documents" ("tenant_id", "direction", "document_number")
  WHERE "deleted_at" IS NULL;

-- ERP connection extensions
ALTER TABLE "erp_connections" ADD COLUMN IF NOT EXISTS "vendor" TEXT;
ALTER TABLE "erp_connections" ADD COLUMN IF NOT EXISTS "version" TEXT;
ALTER TABLE "erp_connections" ADD COLUMN IF NOT EXISTS "system_type" TEXT;
ALTER TABLE "erp_connections" ADD COLUMN IF NOT EXISTS "integration_method" TEXT;
ALTER TABLE "erp_connections" ADD COLUMN IF NOT EXISTS "scope" TEXT;
ALTER TABLE "erp_connections" ADD COLUMN IF NOT EXISTS "environment" TEXT DEFAULT 'test';
ALTER TABLE "erp_connections" ADD COLUMN IF NOT EXISTS "connection_verified" BOOLEAN NOT NULL DEFAULT false;

-- Taxpayer profiles
CREATE TABLE IF NOT EXISTS "taxpayer_profiles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "registered_name" TEXT,
    "tin" TEXT,
    "branch_code" TEXT,
    "office_type" TEXT,
    "rdo_code" TEXT,
    "classification" TEXT,
    "vat_mode" TEXT,
    "business_address" TEXT,
    "contact_name" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "profile_status" TEXT NOT NULL DEFAULT 'NOT_PROVIDED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "taxpayer_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "taxpayer_profiles_tenant_id_key" ON "taxpayer_profiles"("tenant_id");
CREATE INDEX IF NOT EXISTS "taxpayer_profiles_tenant_id_idx" ON "taxpayer_profiles"("tenant_id");
ALTER TABLE "taxpayer_profiles" DROP CONSTRAINT IF EXISTS "taxpayer_profiles_tenant_id_fkey";
ALTER TABLE "taxpayer_profiles" ADD CONSTRAINT "taxpayer_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CAS registrations
CREATE TABLE IF NOT EXISTS "cas_registrations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ack_certificate_ref" TEXT,
    "issued_at" DATE,
    "registered_system" TEXT,
    "system_version" TEXT,
    "rdo_office" TEXT,
    "applicability" TEXT,
    "status" TEXT NOT NULL DEFAULT 'MISSING',
    "reviewer_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cas_registrations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "cas_registrations_tenant_id_idx" ON "cas_registrations"("tenant_id");
CREATE INDEX IF NOT EXISTS "cas_registrations_tenant_id_status_idx" ON "cas_registrations"("tenant_id", "status");
ALTER TABLE "cas_registrations" DROP CONSTRAINT IF EXISTS "cas_registrations_tenant_id_fkey";
ALTER TABLE "cas_registrations" ADD CONSTRAINT "cas_registrations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cas_registrations" DROP CONSTRAINT IF EXISTS "cas_registrations_reviewer_id_fkey";
ALTER TABLE "cas_registrations" ADD CONSTRAINT "cas_registrations_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Compliance documents
CREATE TABLE IF NOT EXISTS "compliance_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "content_base64" TEXT NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "uploaded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "compliance_documents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "compliance_documents_tenant_id_entity_type_entity_id_idx" ON "compliance_documents"("tenant_id", "entity_type", "entity_id");
ALTER TABLE "compliance_documents" DROP CONSTRAINT IF EXISTS "compliance_documents_tenant_id_fkey";
ALTER TABLE "compliance_documents" ADD CONSTRAINT "compliance_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "compliance_documents" DROP CONSTRAINT IF EXISTS "compliance_documents_uploaded_by_id_fkey";
ALTER TABLE "compliance_documents" ADD CONSTRAINT "compliance_documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Field mappings
CREATE TABLE IF NOT EXISTS "field_mappings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "erp_field" TEXT NOT NULL,
    "canonical_field" TEXT NOT NULL,
    "eis_field" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "field_mappings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "field_mappings_connection_id_erp_field_key" ON "field_mappings"("connection_id", "erp_field");
CREATE UNIQUE INDEX IF NOT EXISTS "field_mappings_connection_id_canonical_field_key" ON "field_mappings"("connection_id", "canonical_field");
CREATE INDEX IF NOT EXISTS "field_mappings_tenant_id_idx" ON "field_mappings"("tenant_id");
CREATE INDEX IF NOT EXISTS "field_mappings_connection_id_idx" ON "field_mappings"("connection_id");
ALTER TABLE "field_mappings" DROP CONSTRAINT IF EXISTS "field_mappings_connection_id_fkey";
ALTER TABLE "field_mappings" ADD CONSTRAINT "field_mappings_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "erp_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Compliance validation runs
CREATE TABLE IF NOT EXISTS "compliance_validation_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "rule_version" TEXT NOT NULL,
    "overall_outcome" TEXT NOT NULL,
    "blocking_failure_count" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "compliance_validation_runs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "compliance_validation_runs_tenant_id_created_at_idx" ON "compliance_validation_runs"("tenant_id", "created_at");
CREATE INDEX IF NOT EXISTS "compliance_validation_runs_tenant_id_scope_idx" ON "compliance_validation_runs"("tenant_id", "scope");
ALTER TABLE "compliance_validation_runs" DROP CONSTRAINT IF EXISTS "compliance_validation_runs_tenant_id_fkey";
ALTER TABLE "compliance_validation_runs" ADD CONSTRAINT "compliance_validation_runs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "compliance_validation_results" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "rule_code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "expected" TEXT,
    "actual" TEXT,
    "severity" TEXT NOT NULL,
    "blocking" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "regulatory_reference" TEXT,
    CONSTRAINT "compliance_validation_results_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "compliance_validation_results_run_id_idx" ON "compliance_validation_results"("run_id");
CREATE INDEX IF NOT EXISTS "compliance_validation_results_rule_code_idx" ON "compliance_validation_results"("rule_code");
ALTER TABLE "compliance_validation_results" DROP CONSTRAINT IF EXISTS "compliance_validation_results_run_id_fkey";
ALTER TABLE "compliance_validation_results" ADD CONSTRAINT "compliance_validation_results_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "compliance_validation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Document payload versions
CREATE TABLE IF NOT EXISTS "document_payload_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_document_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_payload_versions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "document_payload_versions_tenant_id_invoice_document_id_created_at_idx" ON "document_payload_versions"("tenant_id", "invoice_document_id", "created_at");
CREATE INDEX IF NOT EXISTS "document_payload_versions_invoice_document_id_kind_idx" ON "document_payload_versions"("invoice_document_id", "kind");
ALTER TABLE "document_payload_versions" DROP CONSTRAINT IF EXISTS "document_payload_versions_invoice_document_id_fkey";
ALTER TABLE "document_payload_versions" ADD CONSTRAINT "document_payload_versions_invoice_document_id_fkey" FOREIGN KEY ("invoice_document_id") REFERENCES "invoice_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Transmission attempts
CREATE TABLE IF NOT EXISTS "transmission_attempts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_document_id" TEXT NOT NULL,
    "attempt_no" INTEGER NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "failure_class" TEXT,
    "http_status" INTEGER,
    "status" TEXT NOT NULL,
    "request_meta" JSONB,
    "response_meta" JSONB,
    "next_retry_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transmission_attempts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "transmission_attempts_tenant_id_idempotency_key_attempt_no_key" ON "transmission_attempts"("tenant_id", "idempotency_key", "attempt_no");
CREATE INDEX IF NOT EXISTS "transmission_attempts_tenant_id_invoice_document_id_idx" ON "transmission_attempts"("tenant_id", "invoice_document_id");
CREATE INDEX IF NOT EXISTS "transmission_attempts_tenant_id_status_idx" ON "transmission_attempts"("tenant_id", "status");
ALTER TABLE "transmission_attempts" DROP CONSTRAINT IF EXISTS "transmission_attempts_invoice_document_id_fkey";
ALTER TABLE "transmission_attempts" ADD CONSTRAINT "transmission_attempts_invoice_document_id_fkey" FOREIGN KEY ("invoice_document_id") REFERENCES "invoice_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Reconciliation
CREATE TABLE IF NOT EXISTS "reconciliation_checks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "finding_count" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reconciliation_checks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "reconciliation_checks_tenant_id_created_at_idx" ON "reconciliation_checks"("tenant_id", "created_at");
ALTER TABLE "reconciliation_checks" DROP CONSTRAINT IF EXISTS "reconciliation_checks_tenant_id_fkey";
ALTER TABLE "reconciliation_checks" ADD CONSTRAINT "reconciliation_checks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "reconciliation_findings" (
    "id" TEXT NOT NULL,
    "check_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "metadata" JSONB,
    CONSTRAINT "reconciliation_findings_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "reconciliation_findings_check_id_idx" ON "reconciliation_findings"("check_id");
CREATE INDEX IF NOT EXISTS "reconciliation_findings_code_idx" ON "reconciliation_findings"("code");
ALTER TABLE "reconciliation_findings" DROP CONSTRAINT IF EXISTS "reconciliation_findings_check_id_fkey";
ALTER TABLE "reconciliation_findings" ADD CONSTRAINT "reconciliation_findings_check_id_fkey" FOREIGN KEY ("check_id") REFERENCES "reconciliation_checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Certification profile
CREATE TABLE IF NOT EXISTS "certification_profiles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ptt_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOT_RECORDED',
    "cert_portal_note" TEXT,
    "notes" TEXT,
    "recorded_by_id" TEXT,
    "recorded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "certification_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "certification_profiles_tenant_id_key" ON "certification_profiles"("tenant_id");
ALTER TABLE "certification_profiles" DROP CONSTRAINT IF EXISTS "certification_profiles_tenant_id_fkey";
ALTER TABLE "certification_profiles" ADD CONSTRAINT "certification_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "certification_profiles" DROP CONSTRAINT IF EXISTS "certification_profiles_recorded_by_id_fkey";
ALTER TABLE "certification_profiles" ADD CONSTRAINT "certification_profiles_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Compliance activation
CREATE TABLE IF NOT EXISTS "compliance_activations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "gate_state" TEXT NOT NULL DEFAULT 'DRAFT',
    "production_enabled" BOOLEAN NOT NULL DEFAULT false,
    "production_enabled_at" TIMESTAMP(3),
    "test_transmission_passed" BOOLEAN NOT NULL DEFAULT false,
    "reconciliation_passed" BOOLEAN NOT NULL DEFAULT false,
    "last_override_reason" TEXT,
    "last_override_at" TIMESTAMP(3),
    "last_override_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "compliance_activations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "compliance_activations_tenant_id_key" ON "compliance_activations"("tenant_id");
ALTER TABLE "compliance_activations" DROP CONSTRAINT IF EXISTS "compliance_activations_tenant_id_fkey";
ALTER TABLE "compliance_activations" ADD CONSTRAINT "compliance_activations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "compliance_activations" DROP CONSTRAINT IF EXISTS "compliance_activations_last_override_by_id_fkey";
ALTER TABLE "compliance_activations" ADD CONSTRAINT "compliance_activations_last_override_by_id_fkey" FOREIGN KEY ("last_override_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
