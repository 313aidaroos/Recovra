# Recovery Engine

The recovery engine is a shared deterministic core with vertical rule packs.

## Boundaries

1. Extraction converts source files into structured candidates with provenance.
2. Normalization maps vendor-specific data into shared charges, agreements, and operational events.
3. Deterministic rules calculate expected cost and variance using fixed-point decimal strings.
4. AI may explain a finding or draft a claim, but cannot set the recoverable amount.
5. Workflow orchestration persists results, requests approval, and records recovery events.

## Code structure

- `src/lib/recovery-engine/core` — shared money, rule, finding, and execution contracts.
- `src/lib/recovery-engine/modules` — vertical rules that implement the common `RecoveryRule` interface.
- `src/app/api/demo/analyze` — clearly labeled sample adapter. It is not a production audit job.

## Rule output

Every finding includes its rule/version, expected and actual values, variance, recoverable amount, confidence, evidence references, severity, explanation, review state, and calculation trace.

## Financial correctness

Amounts enter the engine as decimal strings and are converted to six-decimal fixed-point integers. JavaScript floating-point arithmetic is not used for recovery calculations. Production persistence uses Postgres `numeric(20,6)`.

## Production work still required

- authenticated, organization-scoped ingestion
- durable job queue with retries and idempotency keys
- extraction and normalization adapters
- persistence of immutable rule inputs and content hashes
- reviewer approval transactions
- recovery report exports
- connector-specific sync cursors and secret management
