# Recovra launch checklist

Everything below that is marked **you** needs a dashboard login the agent does not have. Items are
ordered by impact. Each one links to the exact screen.

## A. Go live (blocking)

1. **Merge the release PR** — https://github.com/313aidaroos/Recovra/pull/2
   Vercel deploys `main` to https://recovra-three.vercel.app automatically. No environment
   variables are required.
2. **Sign in and rotate the bootstrap password** — https://recovra-three.vercel.app/login
   Then Settings → Security → *Change password*. Create your organization on the onboarding screen.
3. **Supabase Auth URLs (you)** — https://supabase.com/dashboard/project/ewvgpfufzeyzyutjxuoh/auth/url-configuration
   - Site URL: `https://recovra-three.vercel.app`
   - Redirect URLs: `https://recovra-three.vercel.app/auth/callback`, `https://*.vercel.app/auth/callback`
   Without this, confirmation / magic-link emails for *new* signups point at localhost.

## B. Before a paying customer sees it

4. **Email (you)** — https://supabase.com/dashboard/project/ewvgpfufzeyzyutjxuoh/auth/smtp
   Add SMTP (Resend, Postmark, SES) *or* turn off "Confirm email" at
   https://supabase.com/dashboard/project/ewvgpfufzeyzyutjxuoh/auth/providers → Email.
5. **Custom domain (you)** — Vercel → Project → Settings → Domains
   (https://vercel.com/dashboard → *recovra* → Settings → Domains). Add e.g. `app.recovra.com`,
   create the CNAME it shows at your DNS provider, then update the Supabase Site URL (step 3).
   `*.vercel.app` hosts are served with `noindex`.
6. **PDF invoice transcription (you)** — Vercel → Project → Settings → Environment Variables
   Add `ANTHROPIC_API_KEY` (https://console.anthropic.com/settings/keys) or `OPENAI_API_KEY`
   (https://platform.openai.com/api-keys) for **Production**, redeploy, then confirm
   `https://recovra-three.vercel.app/api/health` shows `"pdfExtraction":"configured"`.
7. **Legal entity details (you, 2 minutes)** — edit `src/lib/legal.ts` or set
   `NEXT_PUBLIC_LEGAL_ENTITY`, `NEXT_PUBLIC_GOVERNING_LAW`, `NEXT_PUBLIC_LEGAL_EMAIL`,
   `NEXT_PUBLIC_LEGAL_ADDRESS` in Vercel. Pages: `/terms`, `/privacy`. Have counsel review
   before signing enterprise customers.
8. **Uptime monitor (you)** — point Better Stack (https://betterstack.com/uptime), Checkly or
   UptimeRobot at `https://recovra-three.vercel.app/api/health`, expect HTTP 200 and body
   containing `"status":"ok"`, 1-minute interval.
9. **Backups (you, optional)** — Supabase Pro already keeps 7 daily backups. For point-in-time
   recovery: https://supabase.com/dashboard/project/ewvgpfufzeyzyutjxuoh/database/backups → PITR.

## C. After launch

10. Carrier / TMS / ERP connectors (need customer credentials; upload is the path until then).
11. Invitation emails for teammates (depends on step 4). Today: teammates sign up, then an admin
    adds them in Settings → Members.
12. Stripe billing if you want self-serve plans instead of invoicing pilots.
13. Vercel WAF / rate limits once the domain is public: Vercel → Project → Firewall.

## Connector launch (per integration, still applies)

Every integration except the sample NorthStar connector is a readiness placeholder. Each real
connector needs provider credentials / OAuth app setup, least-privilege scope review, encrypted
server-side secret storage, sync cursors + retries + idempotency + disconnect/revoke behaviour,
and source-object provenance with tenant-isolation tests.

## Release gate (run before every merge)

```bash
npm ci
npm run lint
npm test
npm run typecheck
npm run build
```

Then smoke-test the deployed URL on desktop and mobile, and run `supabase/tests/tenant_isolation.sql`
after any migration that touches policies.

## What is already done

- Supabase auth, organizations, roles, RLS tenant isolation (tested), private document storage.
- CSV/XLSX invoice + rate-sheet ingestion, deterministic audit rules, evidence-linked findings.
- PDF invoice transcription path (activates with a provider key), confidence-capped and flagged.
- Human-approved recovery workflow, printable claim packet for approved findings.
- Live dashboard, opportunities, recoveries, invoices, contracts, vendors, documents, settings.
- `/api/health`, operations runbook (`docs/OPERATIONS.md`), Terms and Privacy pages.
