# Phase 1 — Current-state audit (Compliance Framework)

Snapshot against Pixelcare BIR-EIS middleware before the Compliance Onboarding & Readiness module.

## Already implemented

- Multi-tenant auth + RBAC (`dashboard.view`, `settings.*`, `users.manage`, `audit.view`, `documents.*`)
- Tenant org branding; EIS credential vault (TIN, cert/prod, PTT metadata, encrypted API key)
- ERP connections + JSON `fieldMap` + sandbox sync / CSV ingest
- Outbound draft → queue → sandbox EIS ack; inbound response inbox
- CAS-shaped unsigned draft JSON (`eisJsonPayload`)
- App-level duplicate document-number check; draft-only edit
- Cancellation sandbox adapter (separate cancel status; does not overwrite EIS acceptance)
- Append-only `AuditLog` + document lifecycle timeline
- Marketing disclaimers: EIS Cert / PTT remain taxpayer obligations

## Partially implemented

- Field mapping: JSON defaults only; no UI; no ERP → canonical → EIS layer
- Invoice validation: Zod headers only; weak TIN; hardcoded BranchCode
- Transmission: queue + sandbox sync; no transmit adapter / retry ledger
- Payload history: overwrites `eisJsonPayload`; no original ERP payload versions
- PTT/cert: vault metadata only; not a certification gate
- Audit: create-only; missing previous/new state, reason, correlation ID
- Duplicate protection: app-level only; no DB unique on active invoice numbers

## Missing (addressed by this module)

- Taxpayer compliance profile
- ERP/CAS profile fields (system type, version, integration method, scope)
- CAS registration documentary evidence + review
- Centralized compliance rule engine
- Quarantine / validation-failure path
- TransmissionAttempt + technical vs business failure + backoff
- Reconciliation dashboard
- EIS Integration Readiness UI
- Production activation state machine (server-enforced)
- Compliance-scoped RBAC permissions
- Automated compliance test suite

## Risky (must not imply BIR verification)

- Never label data “BIR Verified / Certified / Accredited / Approved”
- Use documentary statuses: NOT_PROVIDED, PENDING_REVIEW, DOCUMENTATION_PROVIDED, REVIEWED, etc.
- Call readiness “EIS Integration Readiness” — not “BIR Certified”
- Passing internal readiness ≠ BIR approval, CAS registration, or Permit to Transmit
