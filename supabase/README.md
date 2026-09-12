# Supabase Setup

Recovra's MVP database lives in the Supabase project `recovra` (region us-east-1). The
application talks to it **only** with the publishable key; row-level security enforces
tenant isolation, so no service-role key is deployed anywhere.

## Migrations (applied, in order)

| File | Purpose |
| --- | --- |
| `migrations/20260912000001_core_schema.sql` | Organizations, members, profiles, vendors, documents, contracts/terms, invoices/lines, operational events, audit runs, findings, evidence, recoveries, approvals, savings ledger, audit logs, notifications, module configs. `numeric(20,6)` for all money. RLS enabled + select policies. |
| `migrations/20260912000002_access_control.sql` | Role helpers (`is_org_member`, `has_org_role`), profile trigger, write policies per role, RPCs `create_organization` and `add_organization_member`, private `documents` storage bucket with folder policies. |
| `migrations/20260912000003_function_hardening.sql` | Revokes function execution from `anon`/`public`, hardens `search_path`. |

Apply new migrations with the Supabase CLI (`supabase db push`) or the dashboard SQL editor.
Never edit an applied migration; add a new timestamped file.

## Roles

`owner`, `admin` (manage settings/members) · `finance` (approve + ingest) · `analyst`,
`operations` (ingest, review) · `reviewer`, `viewer` (read-only).

## Tenant-isolation test

`tests/tenant_isolation.sql` seeds two organizations and three users inside a transaction,
switches to the `authenticated` and `anon` roles with forged JWT claims, asserts that no
cross-tenant row or storage object is visible or writable, then rolls back. Run it after
every policy change:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/tenant_isolation.sql
```

It prints `tenant isolation: PASS` on success and raises on the first violation.

## Security advisors

The Supabase linter intentionally reports four `SECURITY DEFINER` functions callable by
signed-in users: `create_organization`, `add_organization_member` (both verify
`auth.uid()` and the caller's role internally) and the boolean helpers `is_org_member`,
`has_org_role` (which only answer about the caller's own memberships).
