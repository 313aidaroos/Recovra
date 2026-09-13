# Recovra Operations Runbook

Production: https://recovra-three.vercel.app · Database/Auth/Storage: Supabase project `recovra` (`ewvgpfufzeyzyutjxuoh`, us-east-1).

## 1. Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | Optional override. Defaults to `https://ewvgpfufzeyzyutjxuoh.supabase.co` (committed in `src/lib/supabase/env.ts`). |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production, Preview | Optional override. Defaults to the production publishable (`sb_publishable_…`) key, which is browser-safe by design. |
| `RECOVRA_FORCE_DEMO` | any | Set to `1` to force the labelled demo workspace (e.g. a marketing-only deployment). |
| `ANTHROPIC_API_KEY` **or** `OPENAI_API_KEY` | Production (and Preview if wanted) | Optional, server-only (no `NEXT_PUBLIC_` prefix). Turns on PDF invoice transcription. Anthropic is preferred when both are set. |
| `RECOVRA_AI_PROVIDER` | Production | Optional: `anthropic` or `openai` to force a provider when both keys exist. |
| `RECOVRA_AI_MODEL` | Production | Optional model override. Defaults: `claude-sonnet-5` (Anthropic) / `gpt-5.4-mini` (OpenAI). |
| `NEXT_PUBLIC_LEGAL_ENTITY`, `NEXT_PUBLIC_GOVERNING_LAW`, `NEXT_PUBLIC_LEGAL_EMAIL`, `NEXT_PUBLIC_LEGAL_ADDRESS` | Production | Company details shown on `/terms` and `/privacy` (defaults live in `src/lib/legal.ts`). Not secret. |

Never add a Supabase secret / service-role key to Vercel or to any `NEXT_PUBLIC_*` variable.
With no variables set, a deployment connects to the production Supabase project automatically.

### PDF transcription (Document Agent)

- `src/lib/ingestion/pdf-extractor.ts` sends the PDF to the provider's API and asks only for a
  transcription of the printed lines (no totals, no estimates). The rows then go through the same
  deterministic parser and rule engine as CSV/XLSX.
- Provenance (`provider`, `model`, read `confidence`, `statedTotal`) is stored on the document;
  the document is left in `needs_review`; each finding's confidence is capped at the read
  confidence and its recoverability forced to `needs_review` (`src/lib/audit/source-extraction.ts`).
  Findings show a "rows transcribed from a PDF" notice; the claim packet repeats it.
- `GET /api/health` reports `features.pdfExtraction: configured|off` so you can confirm the key
  was picked up without exposing it.
- Cost/limits: 20 MB per PDF, 120 s timeout, one provider call per upload. Keys are only read in
  server code; rotate them from the provider dashboard and redeploy.

### Claim packets

- Approved findings expose `/claims/<finding-id>`: a printable dispute letter with calculation,
  contractual basis, evidence fingerprints and the internal approval trail. It is blocked (with an
  explanation) until a recovery is `approved` or later, and every generation is written to
  `audit_logs` as `claim.packet_generated`. People send it; Recovra never emails vendors.

## 2. Supabase Auth configuration (dashboard → Authentication → URL Configuration)

- Site URL: `https://recovra-three.vercel.app`
- Redirect URLs: `https://recovra-three.vercel.app/auth/callback`, `https://*.vercel.app/auth/callback` (previews), `http://localhost:3000/auth/callback`
- Email: either disable "Confirm email" for a frictionless pilot, or configure custom SMTP so
  confirmation and magic-link emails are delivered reliably (the built-in sender is rate-limited to a
  few emails per hour and rejects addresses it considers undeliverable).
- Until the redirect URL is added, confirmation links still confirm the account server-side; users
  then return to the site and sign in with their password (the signup screen says so).
- Bootstrapping accounts without email: an owner/admin can add teammates who already have accounts
  (Settings → Members). Accounts can also be created confirmed via SQL in the Supabase SQL editor
  (see `supabase/README.md`); users then rotate the password in Settings → Security.

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
