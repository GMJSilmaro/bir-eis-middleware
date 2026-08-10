# Demo seed users

Dev-only accounts created by `pnpm run db:seed`. Use on `/login`.

**Password (all users):** `DemoPass123`

## Commands

| Command | What it loads |
|---------|---------------|
| `pnpm run db:seed` | Demo tenant, roles, permissions, users, and sample outbound documents (with EIS response states) |

Optional env: `SEED_BCRYPT_ROUNDS=8` (default) — lower for faster local re-seed.

## Roles

| Role | Name | Email | Documents |
|------|------|-------|-----------|
| Super Admin | Super Admin | `superadmin@demo.local` | View + manage |
| Tenant Admin | Tenant Admin | `admin@demo.local` | View + manage |
| Member | Member | `user@demo.local` | View only |

Demo tenant slug: **demo** (`BIR EIS Demo`).

Sample documents after seed are **outbound** submissions with mixed statuses (draft → queued/submitted with pending EIS response → accepted/rejected). **Inbound** lists those non-draft submissions as the EIS response inbox (not buyer purchase invoices). Legacy buyer-style `direction=inbound` rows are soft-deleted on re-seed. Use **Sync from EIS** on Inbound to apply sandbox accept/reject for pending responses.

## Login example

1. Ensure Postgres is running and `.env.local` is configured
2. `pnpm run db:migrate`
3. `pnpm run db:seed`
4. Open `/login` and sign in as `admin@demo.local` / `DemoPass123`
