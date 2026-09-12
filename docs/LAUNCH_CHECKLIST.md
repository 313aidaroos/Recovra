# Launch Checklist

## Demo / marketing launch

The current application is ready to deploy as a polished, clearly labeled demo. It does not require environment variables because all visible records are sample data.

1. Review and merge the open pull request.
2. In Vercel, import the GitHub repository and select Next.js.
3. Use the repository root, Node.js 22, and the default build command (`npm run build`).
4. Deploy a preview and verify `/`, `/dashboard`, `/opportunities/RCV-2481`, `/documents`, `/integrations`, and `/pricing`.
5. Connect the production domain and verify DNS/SSL.
6. Add Vercel Web Analytics and an error-monitoring provider before sharing broadly.
7. Replace placeholder sales links with the real scheduling/contact destination.
8. Confirm legal pages, privacy policy, terms, and support contact before collecting leads.

## Do not accept customer financial documents yet

The current upload interaction is a local demo and does not persist files. Before processing real customer data:

- provision separate Supabase development and production projects
- convert `supabase/schema.sql` into reviewed migrations
- test RLS with at least two organizations and every role
- implement authentication, organization onboarding, and invite flows
- create private Storage buckets with signed URLs and malware scanning
- implement server-side, organization-scoped repositories and write authorization
- add a durable queue for extraction and reconciliation jobs
- configure secrets only in the deployment secret manager
- implement retention/deletion, audit-log, backup, and incident-response procedures
- complete privacy, DPA, vendor inventory, and security review
- add approval transactions before any claim submission

## Connector launch

Every integration except the sample NorthStar connector is a readiness placeholder. Each real connector needs:

- provider credentials and OAuth application setup
- least-privilege scope review
- encrypted server-side secret storage
- sync cursors, retries, idempotency, and disconnect/revoke behavior
- source-object provenance and tenant-isolation tests

## Final production gate

Run:

```bash
npm ci
npm run lint
npm test
npm run typecheck
npm run build
```

Then perform desktop and mobile smoke tests against the deployed URL.
