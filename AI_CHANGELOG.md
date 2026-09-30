# AI Change Log

## Rules for AI models, bots, and agents

If you are an AI (Claude, ChatGPT, Grok, Gemini, Copilot, Cursor, JunoAI, or any other model, bot, or agent) and you add, modify, or delete anything in this repository, you **must** append a dated entry to this file describing what you changed and why — one entry per work session, no exceptions. This log is how the repository owner tracks what every AI did. Human commits do not need entries.

Entry format:

## YYYY-MM-DD — <your name/model>
- Changed: <files or area>
- Why: <reason>

---

## 2026-09-28 — JunoAI
- Changed: created this file
- Why: owner's standing rule — every AI that touches this repo must log its changes here

## 2026-09-28 — JunoAI
- Changed: Added .github/workflows/ci.yml — thin caller of the shared reusable workflow 313aidaroos/github-actions/.github/workflows/node-ci.yml@main (checkout → Node 20 → npm ci → lint/typecheck/test/build).
- Why: Standardize CI across repos via the shared reusable workflow.

## 2026-09-29 — Grok (Grok Recovra Lead)
- Changed: "Log in with Apixis ID" on /login and /signup (src/lib/apixis-login.ts, src/lib/apixis-redirect.ts, src/app/auth/apixis/start|callback/route.ts, src/components/SignInWithApixis.tsx, login/signup pages); shared Wallet Ixis balance pill in the signed-in header (src/app/api/wallet/balance/route.ts, src/components/ApixisWalletChip.tsx, src/components/app-shell.tsx); additive walletBalance/apixisLoginUrl/exchangeLoginCode in src/lib/apixis-wallet.ts; world agent also provisioned on an older account's first Apixis ID sign-in plus a standing "Your agent is in the Apixis world" link (src/lib/apixis-world-agent.ts + test, src/components/apixis-world-welcome.tsx); styles in src/app/globals.css; NOTES/GROK.md, WORKBOARD.md.
- Also: signup starter Ixis copy/tests 200 → 1000 (Awad lock 2026-09-29; Apixis.dev grants it, Recovra never does); /auth/apixis/callback added (was 404 on production) and always redirects to /login with an error on bad input.
- Why: one Apixis ID = one Apixis Wallet = one Apixis world agent across every Ixis site (Awad's 2026-09-29 brief). Ported from Claude's PR #4 and Renoxis; main's entitlement code and migrations unchanged.
