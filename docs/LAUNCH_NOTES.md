# Recovra: launch notes

_Updated 2026-09-27 (Recovra Lead, after a full read-only audit of `main` @ e145259, PR #4, the live database and the live site). One notes file per repo: real status, what still blocks launch, and the family rules this repo must follow._

## Status

**Live, but paid plans cannot be activated yet.** Production: https://recovra-three.vercel.app. The product lane is parked by Awad; only hub-approved bug fixes ship.

| Area | State (verified 2026-09-27) |
|---|---|
| Pages | `/`, `/pricing`, `/login`, `/signup`, `/dashboard`, `/documents`, `/terms`, `/privacy`, `/support`, `/audit`, `/cixy` return 200 |
| Health | `/api/health`: Supabase, Anthropic and Resend ok; PDF extraction and demo persistence configured. The Wallet probe now calls a real Wallet route (it used a `/api/v1/health` path that doesn't exist, so health falsely showed `degraded`). |
| Buy Ixis | Links go to `https://apixis-wallet.vercel.app/?view=buy&origin=recovra&return_url=…` |
| Plan security | `grant_plan_entitlement` hole **closed** (PR #5; `20260923000001_lock_plan_entitlements.sql` applied live 2026-09-23). Grant/revoke are `service_role` only. |
| Plan gate | `has_active_plan` installed live 2026-09-27. `/documents` no longer bounces signed-in users to `/pricing?error=subscription_check_failed`. |
| Redeem (buy a plan) | **Blocked.** `SUPABASE_SERVICE_ROLE_KEY` is not set in Vercel, so redeem stops before touching the Wallet ("Plan activation is not configured yet"). Nobody is charged. |
| Engine | Freight/AP engine, CSV/XLSX/PDF ingestion, approvals and claim packets (PR #2) are live. No real customer data has been run yet. |

## Connect (in order)

1. `SUPABASE_SERVICE_ROLE_KEY` (project `ewvgpfufzeyzyutjxuoh`): **required, missing.** Only Awad can copy it from the Supabase dashboard (Project settings, API keys). Server only, never `NEXT_PUBLIC_`.
2. Apixis Wallet key: `WALLET_API_KEY` is set. `APIXIS_WALLET_API_URL` is set.
3. AI: `ANTHROPIC_API_KEY` is set (shared family key).
4. For PR #4 only (Sign in with Apixis): `APIXIS_CLIENT_ID=recovra`, plus register `https://recovra-three.vercel.app/auth/apixis/callback` on the Wallet.

Every key this repo reads is listed in `.env.example`.

## Apixis family locks (Awad, 2026-09-27)

1. **Own world agent on signup.** Every Recovra signup gets their own Apixis world agent through Apixis ID (Wallet SSO). Entry: `https://www.apixis.dev/enter?from=recovra`. One shared flow for every product; rollout is Apixis.dev first, then Renoxis, then other products one at a time. **Not wired in Recovra yet.**
2. **Apixis Bank takes 5%** of every Apixis-universe transaction (default `FEE_BPS=500`). Recovra keeps no ledger and takes no fee itself; the cut is applied by Wallet/Bank.
3. **Payments only through Apixis Wallet.** No Recovra Stripe checkout and no local Ixis balance. Redeem goes Wallet reserve, then provision (service-role grant), then capture.

Pricing (Ixis, 100 Ixis = $1): Starter 22,000/mo (`recovra.intel.monthly`), Growth 44,000/mo (`recovra.intel.growth`), Enterprise custom, plus a performance option (success fee only on verified, approved recoveries).

## Database

Migration history on the live project now matches the repo file names exactly (repaired 2026-09-27). The old `0008`-`0011` files were renamed to `20260922000001`-`20260922000003` so a fresh `supabase db push` runs them after the core schema. `0010_revoke_plan_entitlement.sql` was removed: it was never applied live, no code calls it, and the service-only `revoke_plan_entitlement_as_service` replaces it.

## Open items

- `SUPABASE_SERVICE_ROLE_KEY` in Vercel (Awad).
- PR #4 (Sign in with Apixis + SDK v3 + shared balance) conflicts with `main`. It must be rebased: drop its duplicate `20260923000001_plan_entitlement_service_only.sql` and keep `main`'s `*_as_service` functions. On hold per hub.
- Leftover `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Vercel. Unused by code; conflict with the Wallet-only lock. On hold per hub.
- Signup hand-off to `apixis.dev/enter?from=recovra` (world agent). Waits for Recovra's turn in the rollout.
- Legal entity, address and governing law for terms and privacy (Awad).
- Demo audit can be started by logged-out visitors (demo data only; low risk).
- Support form submit not re-verified end to end since the 2026-09-24 debug commits.

_Changes are backend and plumbing only. Pages, design and UI are not changed._
