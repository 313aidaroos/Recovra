# Recovra Agent Instructions

## Mission
Build Recovra into a multi-vertical Recovery Intelligence Platform, not a single-purpose freight app.

## Non-negotiables
1. Preserve the universal data model: agreement -> charge -> actual activity -> expected cost -> variance -> evidence -> recovery -> prevention.
2. Vertical logic belongs in modules/packs, not duplicated apps.
3. Never fabricate savings. Every monetary finding needs source references and a deterministic calculation trail.
4. Keep demo/mock data clearly marked until a real connector replaces it.
5. Multi-tenant isolation is mandatory. Every business object is scoped to an organization.
6. Never expose secret/service-role keys to browser code.
7. Store document provenance and audit logs for every automated decision.
8. Human approval is required before sending claims or changing vendor accounts in the MVP.
9. Design for CFO/Controller/Procurement/Operations users: money, evidence and next action first.
10. Do not redesign the brand into a generic template. Keep the premium dark “control room” visual language unless explicitly instructed.

## UX hierarchy
- First: total spend monitored, found, recovered, prevented, pending.
- Second: highest-value opportunities and actions.
- Third: module health / connected systems.
- Fourth: raw detail.

## Technical direction
- Next.js App Router, TypeScript strict mode.
- Prefer Server Components; use client components only for interaction/state/browser APIs.
- Supabase for MVP data/auth/storage, with RLS on exposed tables.
- Keep long-running audit jobs out of request/response handlers.
- APIs must be idempotent for ingestion and recovery actions.
- Use exact money types in database (numeric/decimal), never floats for billing math.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Apixis family (shared login + shared Wallet)
Read [`docs/APIXIS_FAMILY.md`](docs/APIXIS_FAMILY.md) before touching auth, Ixis or billing. One Ixis balance lives in Apixis Wallet; this site never keeps its own.
