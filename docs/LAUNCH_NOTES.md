# Recovra: launch notes

_Updated 2026-09-25. One notes file per repo: what was changed, file by file, and everything you need to connect. The full family report: https://claude.ai/artifact/QERxA6PMsFK1vdR51Ex2NQ_

## Status

Ready after keys.

## Connect (in order)

1. `SUPABASE_SERVICE_ROLE_KEY`: **required**. Plans are granted server-side only.
2. **Apixis Wallet key.** In the ApixisWallet repo run `npm run family-keys` once. It prints one SQL block (paste it in the Wallet's Supabase SQL editor) and one env block per site. Paste this site's block: `WALLET_API_KEY`, `APIXIS_CLIENT_ID`, `APIXIS_WALLET_API_URL`.
3. AI: `ANTHROPIC_API_KEY` (PDF extraction).

Every key this repo reads is listed in `.env.example` (required, optional, and legacy names to leave unset).

## Apixis Wallet

App `recovra`. Sells `recovra.intel.monthly`, `recovra.intel.growth`.

## Database

`20260923000001_lock_plan_entitlements.sql` applied live (2026-09-23).

## Open items

- Demo audit can be started by logged-out visitors (demo data only; low risk).

## What changed, file by file

Each changed backend code file also starts with a one-line `Change note (Claude, Sep 2026)` comment saying the same thing.

| File | Change |
|---|---|
| `.env.example` | Added 13 key(s) the code reads that were missing: `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `WALLET_API_KEY`, `APIXIS_WALLET_API_URL`, `NEXT_PUBLIC_GOVERNING_LAW`, `NEXT_PUBLIC_LEGAL_ADDRESS`, `NEXT_PUBLIC_LEGAL_EMAIL`, `NEXT_PUBLIC_LEGAL_ENTITY`, `OPENAI_API_KEY`, `RECOVRA_AI_MODEL`, `RECOVRA_FORCE_DEMO`, `APIXIS_WALLET_API_KEY`. |
| `docs/LAUNCH_NOTES.md` | This file. |
| `src/lib/supabase/env.ts` | Reads the service key. |
| `src/lib/supabase/service.ts` | New. Server-only Supabase client. |
| `src/lib/wallet/actions.ts` | Calls the service-only grant/revoke. |
| `supabase/migrations/20260923000001_lock_plan_entitlements.sql` | Grant/revoke plan are service-role only (users could give themselves paid plans). |

**Removed:** Starter zips; build artifacts untracked.

_Changes are backend and plumbing only. Pages, design and UI are not changed except where noted as a build or lint fix with no visual change._
