## 2026-10-04 summary
## 2026-10-04 summary

- **Grok:** added the two-owner admin allowlist and verified-owner plan bypass.
- **Lead:** prepared a Feed preview; it was not merged.
- **Claude/Hermes/Codex/Juno:** Claude, Hermes, and Juno had no commits or merged PRs in this repo on 2026-10-04 CT.



## 2026-09-27 (CT) — Developer Bot (hub)
- Wallet registration: added `recovra` to `wallet_api_clients` in Supabase project `kzneeksminozmhnqaaun`, with `require_sso=false`.
- Callback URLs registered: https://recovra-three.vercel.app/auth/apixis/callback.
- Vercel env: replaced `WALLET_API_KEY` with a per-product `apx_live_` key, added `APIXIS_CLIENT_ID=recovra`, and left legacy `APIXIS_WALLET_API_KEY` present (name-only check); production was redeployed from the same product commit.
- Cleanup status: the attempted deletion of legacy `APIXIS_WALLET_API_KEY` variables was stopped at about 22:45 CT; no deletion was made here.
- Undo: restore `WALLET_API_KEY` to its legacy value and deactivate the `recovra` client row.

## 2026-09-27 — Balance pill rollout: Recovra left unmerged (Grok Bot)
- **What:** No code changed. Awad approved the header Wallet balance pill on all products; Recovra's version was to build on Claude's open PR #4 (Apixis ID + shared Wallet).
- **Why stopped:** bringing main into #4 conflicts in payment/entitlement code: `src/lib/wallet/actions.ts` (main uses `grant_plan_entitlement_as_service`, #4 uses `grant_plan_entitlement_for`) and `src/lib/supabase/service.ts`. #4 also adds migration `20260923000001_plan_entitlement_service_only.sql`, which main has replaced with `20260923000001_lock_plan_entitlements.sql`. These are competing payment implementations, so they can't be resolved cleanly on the product-display side.
- **Next:** Claude rebases #4 onto main (keep main's entitlement code and migration), then add the balance pill; or a balance-only PR once Awad OKs it.
- **Undo:** nothing to undo.

## 2026-09-28 (CT) — Grok Developer Bot: own Apixis world agent for every new Recovra signup
- What: new Recovra accounts (created after 2026-09-28 07:30 UTC, email verified or signed in with Apixis ID) get their own Apixis world agent (default Apixis body, customizable later) plus the one-time 200 in-world Ixis starter grant. Server-side: `GET /api/apixis/world-agent` calls Apixis.dev `POST https://www.apixis.dev/api/agent/provision` with `APIXIS_WORLD_KEY` (Vercel env, sensitive). Idempotent (Apixis-side unique constraints + a flag on the Recovra account). One-time welcome card (Cixy as guide, agent name, Enter via Apixis ID, Not now) at the top of the Command Center (`/dashboard`, live workspaces), plus an "Apixis World ↗" nav link. "Back to Recovra" from the world lands on `/dashboard`. No backfill of older accounts.
- Where: `src/app/api/apixis/world-agent/route.ts`, `src/components/apixis-world-welcome.tsx`, `src/lib/apixis-world.ts`, `src/lib/apixis-world-provision.ts`, `src/lib/apixis-world-agent.ts`, `src/lib/apixis-world-agent.test.ts`, `src/app/(platform)/dashboard/page.tsx`, `src/components/app-shell.tsx`, `public/cixy/cixy-combo-a-avatar.webp`, `.env.example`.
- Not touched: login/signup pages, Wallet pill/balance route, Stripe/payments, existing accounts.
- Undo: revert the PR's squash commit; optionally remove Vercel env `APIXIS_WORLD_KEY` (the route then does nothing). Agents already created stay in Apixis.dev `apixis.agents`.

## 2026-10-02 (CT): Backfill by Recovra Lead (Grok) of everything since the last entry
Read-only backfill made at Awad's request; this commit touches only this file. Times are CT, taken from GitHub merge and close timestamps. Authors are given as the PR branch or commit shows them; all merges went through the `313aidaroos` account.
- **2026-09-27 10:17 PM, PR #9 merged (Recovra Lead, `recovra-lead/live-bugfixes-0927`, squash `1bf4c76`).** Live plan gate fixed (has_active_plan); migrations renamed to `20260922000001-3` (0010 dropped) with live `schema_migrations` aligned; Wallet health probe fixed; `docs/LAUNCH_NOTES.md` refreshed. Files: `src/app/api/health/route.ts`, `supabase/migrations/*`, `supabase/README.md`, `docs/LAUNCH_NOTES.md`. Undo: revert `1bf4c76` (DB migration history would need re-aligning by hand).
- **2026-09-28 4:08 AM, PR #11 merged (Juno, `junoai/ai-changelog`, `b6ab105`).** Added `AGENTS.md` and `AI_CHANGELOG.md`, which require AI change notes. Undo: revert `b6ab105`.
- **2026-09-28 4:58 AM, PR #12 merged (Juno, `junoai/ci`, `61bf3be`).** Shared CI `.github/workflows/ci.yml` plus `JUNOAI_NOTES.md`. Undo: revert `61bf3be`.
- **2026-09-29, PR #13 opened and updated (Grok/Recovra Lead, `grok/ixis-footer`, last commit `52a6d87`).** Adds an "Other Ixis companies" footer row (list in `src/lib/ixis-companies.ts`, 11 sites after Awad removed Nursery Toons and Qahwah World). **Still OPEN, not merged**; it may now overlap the `/companies` page (#20), so Awad decides whether to keep or close it. Undo: close the PR.
- **2026-09-29 11:43 PM, direct-to-main commit `f298bd9` (Awad Alaidaroos).** `src/app/auth/callback/route.ts` now accepts both signup and magiclink tokens. Undo: revert `f298bd9`.
- **2026-09-30 1:23 AM, PR #15 merged (Codex, `codex/tester-readiness`, `d6eabae`).** Apixis ID start and callback routes (`src/app/auth/apixis/start|callback/route.ts`); plan activates only after a confirmed Wallet capture via an idempotent activation RPC and a service-only receipt journal (migration `supabase/migrations/20260930061055_tester_plan_activation.sql`); purchases limited to verified users with billing roles; health reports when plan activation isn't configured. Also touched login, sign-in form, redeem button, `src/lib/wallet/actions.ts`, `src/lib/auth/redirects.ts`, `src/lib/apixis-*.ts`. Undo: revert `d6eabae` (the migration's DB objects would need a down migration).
- **2026-09-30 2:34 AM, PR #16 merged (Claude, `claude/awesome-newton-3tygzi`, `ab2748b`).** Re-synced shared Apixis kits: login (`verifyOtp` type email), SDK v3.1, world kit (15 clients). Files: `src/lib/apixis-login.ts`, `src/lib/apixis-wallet.ts`, `src/lib/apixis-world*.ts`. Undo: revert `ab2748b`.
- **2026-09-30 2:56 AM, PR #17 merged (Claude, `2da4a39`).** Shared family Cixy persona core plus a graceful fallback when the AI provider fails. Files: `src/app/api/cixy/message/route.ts`, `src/lib/apixis-cixy.ts`, `src/lib/cixy/prompt.ts`. Undo: revert `2da4a39`.
- **2026-10-01 8:56 PM, PR #18 merged (Claude, `178175c`).** `.env.example` now lists every env var the code reads. Undo: revert `178175c`.
- **2026-10-01 11:10 PM, PR #19 merged (Claude, `6c77ebd`).** Starter in-world Ixis wording changed from 200 to 1,000 (D11) in the world-agent route, welcome card and tests. Undo: revert `6c77ebd`.
- **2026-10-01 11:18 PM, PRs #14 and #4 closed, not merged (Claude Code via `313aidaroos`, part of the 10/2 family PR cleanup).** #14 (`grok/one-account`) and #4 (`claude/apixis-id-shared-wallet`) were closed as superseded by main's shared kits. Both branches are kept. Undo: reopen the PRs. Note from the 10/2 read-only check: the close comment on #14 says main has "the Wallet pill", but main's header only has a Buy Ixis link, with no balance route or chip, so the balance pill is still to do.
- **2026-10-02 2:47 AM, PR #20 merged (Codex, `codex/apixis-companies-20261002`, `650ac65`).** New `/companies` "Apixis Companies" page (`src/app/companies/page.tsx`, `companies.css`, images in `public/companies/`) and a homepage nav link in `src/app/page.tsx`. Undo: revert `650ac65`.
- **2026-10-02 3:19 AM, PR #21 merged (Codex, `codex/fix-recovra-company-link-20261002`, `e279801`).** Fixed the Recovra link on `/companies`. Undo: revert `e279801`.
- **Env, DB and deploys:** no Vercel env changes by Grok since 9/27. Production auto-deploys main; it is currently on `e279801` (deploy success). As of 10/2, `/api/health` is degraded: Anthropic returns 400, Resend returns 401, and plan activation reports "server key not configured" because `SUPABASE_SERVICE_ROLE_KEY` is missing (Awad). Leftover `STRIPE_*` env is untouched.
- **Freeze:** per Awad's 10/2 STOP, nothing else is changing.

## 2026-10-04 (CT) — Grok: owner admin allowlist (alaidaroosawad@gmail.com, awad@apixis.dev)
- What: Awad's rule — both owner emails are the Recovra owner. How it works: on first sign-in with no workspace, `ensureOwnerWorkspace()` calls the DB function `ensure_recovra_owner_account()`, which makes the person `owner` of the "Recovra Admin" org and turns on both modules; the owner support queue (`/support/queue`, RLS on `support_requests`) is owner-only. Both were hardcoded to awad@apixis.dev. App: `isRecovraOwnerEmail()` now accepts both owner emails + optional `ADMIN_EMAILS` env, case-insensitive; the queue page uses it and needs a confirmed email. DB: new migration `supabase/migrations/20261004230000_owner_admin_emails.sql` lets either owner email bootstrap (verified email only) and read/update the support queue. Nobody else's access changed. No accounts or passwords were created.
- Where: `src/lib/auth/redirects.ts`, `src/lib/auth/owner.ts`, `src/lib/auth/owner.test.ts`, `src/app/support/queue/page.tsx`, `supabase/migrations/20261004230000_owner_admin_emails.sql`; Vercel env `ADMIN_EMAILS` on project `recovra` (production + preview).
- Needs Awad: the migration is NOT applied to prod yet (no SQL access from this session). Until it is, alaidaroosawad@gmail.com passes the app check but the DB still refuses the bootstrap and shows an empty queue; awad@apixis.dev works as before. Apply it with Supabase MCP `apply_migration` or the SQL editor.
- Who: Grok.
- Undo: `git revert <squash SHA>`, delete `ADMIN_EMAILS` in Vercel → recovra → Settings → Environment Variables; DB: re-run the function and the two policies from `20260916000002_auth_owner_support.sql`.

## 2026-10-04 — Owner bypass for the plan gate; owner migration applied (Grok)
- Applied: supabase/migrations/20261004230000_owner_admin_emails.sql was applied to prod ewvgpfufzeyzyutjxuoh via the Supabase MCP. Verified that the owner function includes alaidaroosawad@gmail.com and the 2 support policies were updated.
- What: requireActiveSubscription() (the /documents upload/audit gate) is skipped for a session-proven owner: a confirmed owner email (alaidaroosawad@gmail.com, awad@apixis.dev, plus ADMIN_EMAILS) AND an email-proving sign-in (magic link/OTP, Apixis ID/OAuth, recovery). A password-only session never gets the bypass. This is a product gate only: no subscription row, no Wallet call. Real Wallet purchases still work as normal.
- Found: Recovra auth has alaidaroosawad@gmail.com created and confirmed at the same instant (2026-09-12, password), so it is possibly auto-confirmed. Not touched.
- Where: src/lib/auth/owner.ts (amrProvesEmail, isProvenOwner), src/lib/auth/subscription.ts, and tests in src/lib/auth/owner.test.ts.
- Who: Grok.
- Undo: revert this PR.
## 2026-10-04 catch-up provenance (CT)

The entries below record the day's observed commits and merged PRs. Existing detailed entries above remain the change descriptions; this section supplies exact provenance and undo pointers.

### Commits
- `8fe86ef` (2026-10-04T18:14:42-05:00, 313aidaroos; alaidaroosawad@gmail.com) — Owner bypass for plan gate (session-proven owner only); NOTES: owner migration applied (#23). Undo: undo via the merged PR below: git revert 8fe86ef.
- `dc7d1a1` (2026-10-04T17:47:38-05:00, 313aidaroos; alaidaroosawad@gmail.com) — Owner admin allowlist: both owner emails own Recovra (app + migration) (#22). Undo: undo via the merged PR below: git revert dc7d1a1.
- `f84f12c` (2026-10-04T18:17:51-05:00, 313aidaroos; 313aidaroos@users.noreply.github.com) — Feed tab: Socixis Social family feed at /feed (preview only, do not merge). Undo: no main change; close/delete the branch (or revert the branch commit before reuse).

### Merged PRs
- PR #23, merge `8fe86ef`, `grok/owner-bypass` → `main`, merged 2026-10-04 CT by 313aidaroos: Owner bypass for plan gate (session-proven owner only); NOTES: owner migration applied. Undo: `git revert 8fe86ef`.
- PR #22, merge `dc7d1a1`, `grok/owner-admin-allowlist` → `main`, merged 2026-10-04 CT by 313aidaroos: Owner admin allowlist for alaidaroosawad@gmail.com and awad@apixis.dev. Undo: `git revert dc7d1a1`.

## 2026-10-04 6:50 PM (CT): Recovra Lead (Grok) review of Claude's 10/4 work
- **PR #25 merged 2026-10-04 6:31 PM CT (Claude Code, `claude/great-fermi-6brq7a`, `12e9366`).** Notes only: added `NOTES/CLAUDE.md` (full-portfolio review) and an `AI_CHANGELOG.md` line. No code, env, DB or deploy change. Awad approved it ("okay merge it"). Undo: `git revert 12e9366`.
- **Checked live by Recovra Lead (read-only):**
  - Prod `/api/health` is degraded: Supabase, Anthropic and Wallet are ok; Resend still returns 401; plan activation reports "server key not configured" (`SUPABASE_SERVICE_ROLE_KEY` is missing; needs Awad).
  - `add_organization_member` already requires the caller to be an org owner or admin (`has_org_role`), so Claude's open question is closed and needs no change.
  - The Ominix link `nexxis-tau.vercel.app` on `/companies` returns 200 and serves Ominix, so it isn't broken; it changes only if Ominix gets a new canonical host.
  - All 15 `/companies` links return 200.
  - The homepage has no religious text.
- **Flagged, not changed:** `/companies` (Codex #20) draws its company icons as inline `<svg>`, and `src/app/icon.svg` is the favicon. If the no-SVG lock covers icons as well as Cixy art, Codex should swap them for real art.
- Who: Recovra Lead (Grok). This commit touches only this file. Undo: revert this commit.
