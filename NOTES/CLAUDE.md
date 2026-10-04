# Claude notes (Recovra)

Dated notes from Claude (Claude Code), same purpose as `NOTES/GROK.md`: what Claude checked or changed here, what it found, what is still open and who owns it. The one family status board is `ApixisWallet/docs/FAMILY_STATUS.md`.

## 2026-10-04 (UTC) — Claude: full-portfolio review (read-only; this note and the AI_CHANGELOG line are the only changes)

### Snapshot
- Reviewed `main` @ `756f9f2`; the owner admin allowlist merged → `main` is `dc7d1a1`. Vercel `recovra` production READY. The live host is `recovra-three.vercel.app` — `recovra.vercel.app` is a different app (naming hazard in links).
- Supabase `ewvgpfufzeyzyutjxuoh`: 12 tracked migrations, all applied, including `lock_plan_entitlements` (09-23: the free-paid-plan hole is closed) and `tester_plan_activation` (09-30).
- Open PR per the family board: #13 footer.

### Verified this session (on 756f9f2)
- `npm run lint`, `typecheck`, `test` (vitest, 12 files), `build`: all pass on Node 22.
- SDK copies identical to canonical (wallet, login, redirect, cixy, world agent/provision); `apixis-world.ts` one revision behind like every site.
- Advisors: `create_support_request` and `upsert_demo_audit_run` executable by anon (contact form + demo, intended); seven SECURITY DEFINER helpers executable by authenticated (`has_active_plan`, `add_organization_member`, `create_organization`, `discard_failed_document`, `ensure_recovra_owner_account`, `has_org_role`, `is_org_member`) — confirm `add_organization_member` checks the caller's org role inside; `plan_activation_receipts` RLS on with no policies (service-only, intended); leaked-password WARN.

### Done (live)
Landing + pricing, command center (opportunities, invoices, contracts, vendors, documents, ingest, integrations, modules, recoveries, reports, settings), claims, audit, Apixis ID + magic link + onboarding, Cixy (shared core + calm fallback), paid-plan activation via the Wallet (capture-first, receipt journal, idempotent RPC, billing roles), world agent, support + support queue, terms/privacy (env-driven legal entity), health route, CI.

### Open — needs Awad
- `SUPABASE_SERVICE_ROLE_KEY` on Vercel project `recovra` — the one blocker: paid plans cannot activate without it.
- `NEXT_PUBLIC_LEGAL_ENTITY / _ADDRESS / _EMAIL / _GOVERNING_LAW` for the legal pages.
- PR #13 footer.
- Product scope: everything shown is sample data and the only analysis path is `/api/demo/analyze`. Real invoice / contract ingestion and reconciliation — the product itself — is not built. Decide the roadmap before promising it to a tester.

### Open — Claude can do on your go
- `src/app/companies/page.tsx` links Ominix to `nexxis-tau.vercel.app` (retired host).
- Check whether `RECOVRA_AI_PROVIDER / RECOVRA_AI_API_KEY / RECOVRA_ENCRYPTION_KEY` (first lines of `.env.example`) are still read; extraction uses `ANTHROPIC_API_KEY`.
- Read `add_organization_member` and tighten it if it does not check the caller's role.
- WORKBOARD still carries a 09-28 "in review" line (archive per D15, or clear it).
