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

## 2026-09-30 — Codex — Tester readiness: paid activation and login safety

- Updated the Wallet SDK from the canonical v3 source; paid access is now activated only after confirmed capture, so a failed capture cannot delete an earlier paid period.
- Added a service-only receipt journal and idempotent activation RPC; restricted purchases to verified users with billing roles and persisted each purchase attempt for safe retries.
- Reused the canonical redirect validator in local auth. Health no longer treats unauthorized email credentials as working and reports missing plan activation configuration.
- No styling or pricing changes. Migration and controlled verification must precede enabling plan activation.

- Added the missing Apixis sign-in start/callback routes using the canonical helper and connected the login form to them. The Wallet registry already contains the production callback.
- Verification: 65 tests, TypeScript and production build passed before adding shared-login routes; receipt replay/renewal/permission SQL checks passed with all fixtures rolled back. New receipt journal is intentionally server-only (RLS enabled, no client policies or grants).
