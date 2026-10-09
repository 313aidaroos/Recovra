# Orbit integration handoff — Recovra (2026-10-09)

**Status: NOT CONNECTED.** This branch adds a repo-specific build contract and a machine-readable capability declaration. It does not expose an API or integrate product data yet.

## Existing evidence
`README.md` and `AGENTS.md` define a multi-vertical recovery engine and require tenant scoping, contract/invoice evidence, deterministic calculations, and clear labeling of demo data.

## First safe capability
- ID: `recovra.findings.read` · Mode: `read` · Status: `planned`.
- Intended behavior: Return only genuine evidence-backed recovery findings owned by the signed-in organization, with links to proof and clear uncertainty; never claim recovered dollars from demonstrations.
- Proposed route: `GET /api/orbit/v1/findings (proposed; read only)`

## Build tasks
1. Define and verify a real organization-to-Apixis subject binding.
2. Reuse organization-scoped evidence/findings query with numeric/currency precision.
3. Strip private document contents from response; link to owner-authorized records only.
4. Add source document ID, rule version, status, and provenance timestamps.
5. Test org A/B isolation, sample-data filtering, redaction and missing integration.

## Shared Apixis rules
- Orbit Core proposal: https://github.com/313aidaroos/Apixis.dev/pull/86 (draft). This repo is **NOT connected** to Orbit by this documentation PR.
- Use the existing Apixis ID subject and product tenant binding; never trust an email, tenant ID, or asset ID passed by the browser without server-side authorization.
- Preserve existing ApixisWallet as the sole customer-credit ledger; no duplicate balance, checkout or hidden fee. The product's own approval, RLS, licensing and audit requirements remain authoritative.
- Orbit requests are scoped **read-only** or **draft-only** until an independently reviewed explicit-approval flow exists. No direct payment, order acceptance, outreach, trade, settlement or emergency action.
- Never present previews, stale positions, sample findings, fabricated prices or demo data as live activity.
- A later server-to-server adapter must use dedicated, rotated service authentication, replay prevention, per-actor authorization, audit logs, rate limiting and bounded timeout/retries.

## Proposed response contract (not live)
```json
{
  "version": "orbit-adapter-v1",
  "capability": "<capability-id>",
  "source": "<venture>",
  "demo": false,
  "sourceRecordedAt": "<ISO8601>",
  "summary": "<short factual result>",
  "data": {}
}
```
The source timestamp and demo flag must reflect actual data. Never substitute the request timestamp for the source timestamp. For missing credentials or incomplete deployment return an explicit unavailable error, not an empty successful real-world result.

## Verification before enablement
- Signed-out and wrong-tenant calls denied; verified same-owner call succeeds.
- Existing app functions and existing private data remain intact.
- Real data has provenance/time; sample data is flagged demo.
- Missing service credentials fail closed.
- All financial/external/write actions remain blocked.
- Automated tests include two-account tenant isolation and failed/retried network requests.

**Do not enable the matching Orbit Core capability until a code-level adapter, tests and production credential setup are reviewed.**
