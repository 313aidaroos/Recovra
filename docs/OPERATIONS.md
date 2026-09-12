# Recovra Operations Runbook

Production: https://recovra-three.vercel.app · Database/Auth/Storage: Supabase project `recovra` (`ewvgpfufzeyzyutjxuoh`, us-east-1).

## 1. Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | `https://ewvgpfufzeyzyutjxuoh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production, Preview | Publishable (`sb_publishable_…`) key only. Browser-safe by design. |
| `RECOVRA_AI_PROVIDER`, `RECOVRA_AI_API_KEY` | Production | Optional. Enables the Document Agent for PDF/scan extraction. Server-only. |

Never add a Supabase secret / service-role key to Vercel or to any `NEXT_PUBLIC_*` variable.
When these variables are absent the app runs in clearly labelled demo mode.

## 2. Supabase Auth configuration (dashboard → Authentication → URL Configuration)

- Site URL: `https://recovra-three.vercel.app`
- Redirect URLs: `https://recovra-three.vercel.app/auth/callback`, `https://*.vercel.app/auth/callback` (previews), `http://localhost:3000/auth/callback`
- Email: either disable "Confirm email" for a frictionless pilot, or configure custom SMTP so
  confirmation and magic-link emails are delivered reliably (the built-in sender is rate-limited).

## 3. Monitoring

- **Liveness**: `GET /api/health` returns `200 {"status":"ok"}` when the app can reach Supabase
  Auth, `503 {"status":"degraded"}` otherwise. Point an uptime monitor (Vercel Checks, Better
  Stack, Checkly, UptimeRobot) at it with a 1-minute interval. The endpoint never returns
  secrets or configuration values.
- **Application logs**: Vercel → Observability → Logs (server actions, route handlers).
  Filter on `uploadDocumentAction`, `auditInvoice`, `transitionRecoveryAction`.
- **Database**: Supabase → Reports (CPU, connections, disk) and → Logs → Postgres / Auth / Storage.
  Run the Security and Performance advisors after each migration (`get_advisors`).
- **Business audit trail**: every upload, audit, workflow transition and membership change is
  written to `public.audit_logs` with the acting user. Query per organization for compliance reviews.

## 4. Backups and recovery

- Supabase Pro includes **daily automated backups with 7-day retention**. For point-in-time
  recovery (PITR, per-minute granularity) enable the PITR add-on in Supabase → Database → Backups.
- Storage objects in the `documents` bucket are stored in S3-backed storage; keep the
  `documents` table as the index (path, SHA-256, provenance). To export a tenant's files, list
  `storage.objects` under `<organization_id>/` and download via signed URLs.
- Recommended cadence: weekly `pg_dump` of the `public` schema to an off-platform bucket
  (`supabase db dump --linked > backups/recovra-$(date +%F).sql`), retained 90 days.
- Restore drill: create a Supabase branch or a fresh project, apply `supabase/migrations`, restore
  the dump, run `supabase/tests/tenant_isolation.sql`.

## 5. Deploy / rollback

- Merging to `main` deploys automatically on Vercel. Preview deployments are created per PR.
- Rollback: Vercel → Deployments → previous production deployment → "Promote to Production".
  Database migrations are additive; never roll back a migration in production, add a corrective one.
- Pre-deploy checklist: `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run build`,
  run `supabase/tests/tenant_isolation.sql` if any policy changed.

## 6. Security posture (current)

- Tenant isolation: RLS on all business tables and storage; verified by the rolled-back test script.
- Privileges: `anon` cannot execute any function; writes are limited by role (writer / approver / admin).
- Money: `numeric(20,6)` in Postgres, fixed-point BigInt arithmetic in the engine; no floats.
- Human approval: claims can only be approved by owner/admin/finance with evidence confirmation;
  Recovra records external submissions but never sends claims itself.
- Idempotency: documents deduplicated by SHA-256, findings upserted on a deterministic dedupe key,
  rate sheets superseded by title.

## 7. Incident response

1. Check `/api/health` and Vercel deployment status.
2. Check Supabase project health (paused? disk? connection limits).
3. Review Vercel function logs for the failing action; review `audit_logs` for the affected organization.
4. If data integrity is in question, pause ingestion (revoke writer roles temporarily via
   `organization_members`) and restore from backup/PITR to a branch to compare.
