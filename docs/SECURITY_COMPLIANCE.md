# Security & Compliance Direction

This is a product engineering checklist, not legal advice.

## Data posture
Recovra may process contracts, invoices, employee seat data, vendor accounts and operational records. Treat all customer documents as confidential business data.

## Required controls
- Tenant isolation at every layer
- RLS on every exposed Supabase table
- Never expose secret/service-role keys client-side
- TLS in transit; managed encryption at rest
- least-privilege OAuth scopes/connectors
- secrets stored in deployment secret manager
- immutable audit log for sensitive actions
- file malware scanning pipeline before processing
- signed upload/download URLs with expiry
- retention/deletion policy
- role-based approvals for external claims
- MFA/SSO roadmap for enterprise
- incident response and backup restoration tests

## Financial correctness controls
- exact decimal/numeric database types
- source provenance per field
- calculation version and checksum
- dual classification: estimated vs verified
- threshold-based human review
- immutable realized-savings ledger entries

## Compliance roadmap
Phase 1: security baseline, DPA/privacy policy, vendor inventory, access reviews.
Phase 2: SOC 2 readiness and penetration testing.
Phase 3: enterprise SSO/SCIM, audit exports, advanced retention/data residency.
Industry-specific requirements must be evaluated before handling regulated categories.

## Supabase notes
- Newer Supabase projects may require explicit Data API grants; RLS and grants are separate controls.
- Do not use user-editable metadata for authorization.
- Keep authorization in organization memberships / trusted app metadata.
