# API Contract Direction

## Resource families
`/organizations`
`/vendors`
`/documents`
`/contracts`
`/invoices`
`/operational-events`
`/audit-runs`
`/findings`
`/recoveries`
`/integrations`
`/savings-ledger`

## Ingestion principles
- idempotency key on write endpoints
- source system + source object ID uniqueness
- asynchronous status for extraction/audit jobs
- immutable original source metadata

## Finding payload essentials
```json
{
  "finding_id": "...",
  "module": "logistics",
  "category": "fuel_surcharge_mismatch",
  "billed_amount": "812.44",
  "expected_amount": "655.90",
  "variance_amount": "156.54",
  "currency": "USD",
  "confidence": 0.97,
  "recoverability": "claim_ready",
  "calculation_rule_version": "fuel-surcharge-v3",
  "evidence": []
}
```

## Webhooks
Future external events: audit.completed, finding.verified, recovery.submitted, recovery.approved, savings.realized.
Sign payloads and support replay protection.
