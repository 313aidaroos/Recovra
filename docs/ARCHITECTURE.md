# Architecture

## Logical services

### 1. Ingestion Gateway
Accepts uploads/connectors, fingerprints files, stores immutable originals, assigns org/vendor/source metadata.

### 2. Document Intelligence
Classifies documents and extracts structured fields with page/row/cell provenance. OCR as needed. Produces confidence scores; low-confidence fields enter review.

### 3. Contract Term Service
Normalizes rates, tiers, discount schedules, effective dates, SLAs, rebates, renewal clauses and exclusions into machine-readable terms.

### 4. Operational Truth Service
Normalizes actual events: shipments, seats, usage, transactions, meters, receiving, equipment days, etc.

### 5. Rules / Expected Cost Engine
Deterministic money engine. Takes normalized terms + operational events and calculates expected charges. Version every rule.

### 6. Finding Engine
Compares expected vs billed. Classifies discrepancy, confidence, severity and recoverability.

### 7. Evidence Graph
Links every finding to contract clauses, invoice lines and operational events. Generates a reproducible calculation trace.

### 8. Recovery Workflow
Drafts claim, collects approval, packages evidence, submits through supported channel, tracks vendor responses and realized value.

### 9. Prevention Engine
Runs the same rules pre-payment, pre-renewal or near-real-time to stop recurring leakage.

### 10. Optimization / Negotiation Intelligence
Uses historical outcomes and benchmarks to suggest renewals, consolidations, routing/model changes and negotiation targets. Keep benchmarks privacy-safe.

## Data flow
Connector/Upload -> Source document -> Extraction -> Normalized entities -> Audit run -> Findings -> Review -> Recovery -> Savings ledger -> Prevention rules

## Background jobs
Do not perform OCR, large file extraction, reconciliation batches or external claim workflows inside a normal web request. Queue them with durable status, retries and idempotency keys.

## LLM boundary
Good uses:
- document classification
- clause extraction
- entity normalization suggestions
- finding explanation
- draft dispute letters
- natural-language search

Do not use LLM alone for:
- final expected charge math
- ledger balances
- access control
- payment execution
- declaring a vendor legally liable

## Integration abstraction
Each connector implements:
- auth/permission metadata
- sync cursor
- objects supported
- normalization mapping
- source provenance
- retry behavior
- revoke/disconnect

## Scale path
MVP: Next.js + Supabase + managed queue/workflow provider.
Scale: isolate ingestion/rules workers; warehouse analytics; read replicas; event bus; dedicated secrets vault; enterprise SSO/SCIM; customer-specific data residency as needed.
