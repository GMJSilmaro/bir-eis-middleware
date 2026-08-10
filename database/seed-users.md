# Demo seed users

Dev-only accounts created by `pnpm run db:seed`. Use on `/login`.

**Password (all users):** `DemoPass123`

## Commands

| Command | What it loads |
|---------|---------------|
| `pnpm run db:seed` | Demo tenant, roles, permissions, and users |

Optional env: `SEED_BCRYPT_ROUNDS=8` (default) — lower for faster local re-seed.

## Roles

| Role | Name | Email |
|------|------|-------|
| Super Admin | Super Admin | `superadmin@demo.local` |
| Tenant Admin | Tenant Admin | `admin@demo.local` |
| Member | Member | `user@demo.local` |

Demo tenant slug: **demo** (`BIR EIS Demo`).

## Login example

1. Ensure Postgres is running and `.env.local` is configured
2. `pnpm run db:migrate`
3. `pnpm run db:seed`
4. Open `/login` and sign in as `admin@demo.local` / `DemoPass123`
