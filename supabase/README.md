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
| `migrations/20260912000004_discard_failed_document.sql` | RPC to discard a failed document and derived rows before retry. |
| `migrations/20260912000005_discard_failed_document_release.sql` | Follow-up release of discard_failed_document. |
| `migrations/20260916000001_demo_audit_runs.sql` | Labeled public demo audit table + `upsert_demo_audit_run` RPC. Isolated from tenant tables. `claims_sent` constrained to false. |

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

## Creating a confirmed account without email (bootstrap)

Run in the SQL editor, then have the person change the password in Settings → Security:

```sql
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'person@company.com', extensions.crypt('<temporary password>', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Person Name"}', now(), now(), '', '', '', '');
```
