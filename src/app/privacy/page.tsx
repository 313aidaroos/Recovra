import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, type LegalSection } from "@/components/legal/legal-layout";
import { legalConfig } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy Policy", description: "How Recovra collects, uses, stores and protects data." };

const { productName, legalEntity, contactEmail, postalAddress, hosting } = legalConfig;

const sections: LegalSection[] = [
  { id: "scope", title: "1. Who this covers", body: (
    <>
      <p>This Privacy Policy explains how {legalEntity} (&ldquo;we&rdquo;) handles personal data when you visit our websites, create an account, or use the {productName} platform (the &ldquo;Service&rdquo;). For data inside a customer&rsquo;s workspace (invoices, contracts, shipment records) we act as a processor on the customer&rsquo;s instructions; for account, billing and website data we act as a controller.</p>
    </>
  ) },
  { id: "data", title: "2. Data we collect", body: (
    <>
      <ul>
        <li><strong>Account data:</strong> name, work email, hashed password or sign-in tokens, organization membership and role.</li>
        <li><strong>Customer Data you upload:</strong> invoices, rate sheets, contracts and operational files. These are commercial records and may incidentally contain names, addresses or contact details of vendor or shipping personnel.</li>
        <li><strong>Activity and audit logs:</strong> who uploaded, verified, approved, submitted or closed each item, with timestamps. These logs exist so financial decisions are traceable and cannot be disabled by users.</li>
        <li><strong>Technical data:</strong> IP address, browser and device information, and diagnostic logs needed to run and secure the Service.</li>
      </ul>
      <p>We do not sell personal data and do not use Customer Data to train machine-learning models.</p>
    </>
  ) },
  { id: "use", title: "3. How we use it", body: (
    <>
      <ul>
        <li>To provide the Service: store documents, compute findings, run approval workflows and display dashboards to authorised members of your organization.</li>
        <li>To secure the Service: authentication, tenant isolation, abuse and fraud prevention, incident investigation.</li>
        <li>To operate our business: billing, support, service notices and legally required record-keeping.</li>
        <li>With your consent or where permitted: product updates and marketing, which you can opt out of at any time.</li>
      </ul>
    </>
  ) },
  { id: "ai", title: "4. Document transcription by AI models", body: (
    <>
      <p>When a customer enables PDF transcription, the PDF is sent to the configured model provider (Anthropic or OpenAI, under our API agreement with them) solely to convert the printed content into structured rows. The provider name, model and read confidence are stored with the document, and findings derived from transcribed rows are marked for human verification. API-based providers process the content to return the result and, under their API terms, do not use it to train their models. Spreadsheet uploads are parsed entirely within our infrastructure and never leave it.</p>
    </>
  ) },
  { id: "sharing", title: "5. Who we share it with", body: (
    <>
      <ul>
        <li><strong>Infrastructure providers:</strong> database, authentication and file storage on {hosting.database}; application hosting and edge network on {hosting.application}.</li>
        <li><strong>Model providers:</strong> only for PDF transcription as described above, only when enabled by the customer.</li>
        <li><strong>Email and payment processors</strong> when those features are enabled for your account.</li>
        <li><strong>Authorities</strong> where required by law, after review and, where lawful, notice to you.</li>
      </ul>
      <p>We do not share one customer&rsquo;s data with another. Every business object is scoped to a single organization and enforced with database row-level security.</p>
    </>
  ) },
  { id: "security", title: "6. Security", body: (
    <>
      <p>Data is encrypted in transit (TLS) and at rest. Files live in a private bucket with per-organization folder policies; database access is governed by row-level security and role checks; only owners and admins can delete records. Secret keys are never shipped to browsers. Every automated decision and every human workflow step is written to an audit log. Our database provider takes daily backups, and restores are tested as part of our operations runbook. No system is perfectly secure; if we learn of a breach affecting your data we will notify you without undue delay.</p>
    </>
  ) },
  { id: "retention", title: "7. Retention", body: (
    <>
      <p>Customer Data is retained while your organization uses the Service and deleted from production within 60 days of account closure or a verified deletion request, subject to backup rotation (up to 30 additional days) and legal obligations. Audit logs relating to financial approvals may be retained for up to 7 years where required for accounting or tax purposes, in which case they are restricted to that purpose.</p>
    </>
  ) },
  { id: "transfers", title: "8. International transfers", body: (
    <>
      <p>Our infrastructure is located in the United States. If you access the Service from other regions, your data is transferred to and processed there. Where required we rely on standard contractual clauses or an equivalent lawful mechanism and will enter into a data processing agreement on request.</p>
    </>
  ) },
  { id: "rights", title: "9. Your rights", body: (
    <>
      <p>Depending on where you live you may have rights to access, correct, delete, restrict or port your personal data, or to object to certain processing. Workspace members can update their own profile and password in Settings; organization admins can remove members and delete documents. For anything else, or if you are a vendor employee whose details appear in a customer&rsquo;s invoice, contact us and we will respond within 30 days or refer the request to the relevant customer where we act as processor.</p>
    </>
  ) },
  { id: "cookies", title: "10. Cookies", body: (
    <>
      <p>We use strictly necessary cookies to keep you signed in and protect against cross-site request forgery. We do not run third-party advertising trackers. Aggregate, privacy-preserving analytics may be enabled by the hosting platform to measure page performance.</p>
    </>
  ) },
  { id: "contact", title: "11. Contact and changes", body: (
    <>
      <p>Privacy questions and requests: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>{postalAddress ? <> · {postalAddress}</> : null}. We may update this policy; material changes are announced inside the Service or by email, and the date at the top reflects the latest revision. See also our <Link href="/terms">Terms of Service</Link>.</p>
    </>
  ) },
];

export default function PrivacyPage() {
  return <LegalLayout eyebrow="Legal" title="Privacy Policy" intro="What we collect, why, where it lives, and the controls that keep each organization's data isolated." sections={sections}/>;
}
