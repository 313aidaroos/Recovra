# Product Requirements Document

## Product
Recovra — Recovery Intelligence Platform

## Primary users
- CFO / VP Finance
- Controller / AP leader
- Procurement leader
- CIO / Head of IT / FinOps
- Logistics / Supply Chain leader
- Operations leader
- Business owner / multi-location operator

## Primary jobs to be done
1. Tell me where we are overpaying.
2. Prove it with the contract, invoice and actual activity.
3. Quantify what is recoverable versus only optimizable.
4. Give me the next best action.
5. Track the recovery until value is realized.
6. Stop the same leakage before the next payment.

## MVP functional requirements
### Organization & access
- Create organization
- Invite users
- Roles: owner, admin, analyst, reviewer, viewer
- Organization-level data isolation

### Ingestion
- Drag/drop PDF, CSV, XLSX, images and structured JSON
- Classify document type
- Vendor detection
- Duplicate-file detection via hash
- Store original immutable source
- Extraction status and errors

### Contracts
- Effective dates
- Rates / tiers / discounts
- minimums / maximums
- rebates / credits
- SLAs
- renewal/termination dates
- source-page references

### Billing
- Invoice header and lines
- quantities, units, rates, taxes, fees, surcharges
- vendor/account/location/cost center
- source references

### Operational truth
Examples: shipment, token usage, cloud meter, active seat, transaction, kWh, equipment rental day, delivered material quantity.

### Audit engine
For every candidate charge:
`expected = rules(contract_terms, operational_truth)`
`variance = billed - expected`

Finding must include:
- category
- billed value
- expected value
- variance
- confidence
- severity
- calculation trace
- evidence sources
- recovery eligibility
- recommended action

### Recovery workflow
Statuses:
- detected
- needs_review
- claim_ready
- approved_to_submit
- submitted
- vendor_review
- approved
- partially_approved
- denied
- realized
- closed

### Savings ledger
Separate:
- estimated opportunity
- verified opportunity
- claim submitted
- vendor-approved credit
- realized recovery
- prevented future spend
- optimization recommendation

### Dashboard
- Spend monitored
- Opportunity found
- Verified recoverable
- Submitted
- Recovered
- Prevented
- Pending
- Module/value breakdown
- Top opportunities
- Recovery pipeline
- Recent activity

## Non-functional requirements
- Exact decimal money math
- Complete audit trail
- Encrypt in transit/at rest
- least-privilege connector permissions
- idempotent ingestion
- retries and dead-letter handling
- explainable calculations
- exportable evidence packet
- responsive UX
- fast first dashboard paint

## Not MVP
- Fully autonomous external claims without approval
- Banking/money movement
- Replacing the customer's ERP
- Clinical/medical claim adjudication
- Tax/legal determinations without specialized review
