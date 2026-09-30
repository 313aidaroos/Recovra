Grok Bot (Developer Bot hub + product leads) notes. Every change Grok Bot makes to this product (code, env, database, deploys) gets a dated entry here so Claude, Hermes and Codex stay on the same page.

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

## 2026-09-29 (CT) — Grok Recovra Lead: "Other Ixis companies" footer
- What: added an "Other Ixis companies" row directly under the existing homepage footer, with plain text links (new tab, `rel="noopener noreferrer"`) to the approved Ixis sites (11 after the 2026-09-29 update removed Nursery Toons and Qahwah World). Recovra is left out, as are Nexxis/Omnixis, Launchixis, PersonalContentBot, AwadBot and COMMAND. It reuses the existing `.marketing footer` look; the only new CSS is one rule that lets the row wrap and removes its top border and padding so it sits under the footer.
- Where: `src/lib/ixis-companies.ts` (the one list; swap URLs here when custom domains arrive), `src/components/ixis-companies-footer.tsx`, `src/app/page.tsx`, `src/app/globals.css`.
- Not touched: existing footer links, other pages, env, database, deploys. PR opened with a Vercel preview only; not merged.
- Undo: revert the PR's commit (or delete the `<IxisCompaniesFooter />` line in `src/app/page.tsx`).
