# Recovra — Recovery Intelligence Platform

**Tagline:** Find overcharges. Recover savings. Control spend.

Recovra is designed as a universal reconciliation and recovery layer for business spend. It compares what a company **agreed to pay**, **was billed**, and **actually consumed/received**, then turns discrepancies into evidence-backed recovery opportunities and prevention controls.

## What is in this repo

- Premium interactive Next.js starter UI with marketing site + operating dashboard
- A universal Recovery Engine model
- Vertical packs for Logistics, AI/Cloud, SaaS, Telecom, Payments, Ecommerce, Manufacturing, Distribution, Construction, Utilities, Property, Hospitality, Retail, Procurement/AP, Fleet and Healthcare/Admin
- Supabase-ready schema starter
- Product requirements, architecture, security, GTM, pricing and roadmap docs
- Cursor/Claude build prompt and AGENTS.md guardrails
- Demo API route and sample data so the interface works before integrations are connected

## Local start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

> After `npm install`, commit the generated lockfile. Dependencies are pinned in `package.json`; update deliberately.

## Quality checks

```bash
npm run lint
npm test
npm run typecheck
npm run build
```

## Current product foundation

- Public enterprise landing page and configurable pricing presentation
- Responsive command center with opportunities, pipeline, activity, module, document, and vendor intelligence
- Recovery opportunities with source evidence, deterministic calculation trace, claim draft, and human approval gate
- Invoice, contract, vendor, document, integration, reporting, module, recovery, and settings routes
- Shared recovery-engine contracts with a fixed-point logistics rate-variance rule
- Organization-scoped Supabase starter schema with RLS enabled on every exposed business table

All organizations, companies, metrics, findings, and recoveries currently shown in the interface are **sample/demo data**. The only API under `/api/demo` is intentionally a sample adapter. It must not be represented as a production audit or customer result.

## Recommended production stack

- Next.js App Router
- Supabase Postgres/Auth/Storage
- Vercel
- Object storage for source documents
- Queue/workflow layer for long-running audit jobs
- OCR/document extraction provider
- LLM abstraction layer for contract/invoice extraction and explanations
- Deterministic rules/calculation engine for money conclusions

## Critical product principle

LLMs may extract, classify, explain and draft. **They should not be the sole calculator of recoverable money.** Monetary findings should be backed by deterministic rules, source evidence, confidence scoring and human-review thresholds.

## Build order

1. Freight/parcel + generic AP upload workflow
2. Contract + invoice reconciliation
3. Findings + evidence + recovery workflow
4. SaaS/AI spend module
5. Integrations
6. Prevent-before-pay controls
7. Benchmarking and negotiation intelligence

See `docs/ROADMAP.md` and `CURSOR_MASTER_PROMPT.md`.
