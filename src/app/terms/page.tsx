import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, type LegalSection } from "@/components/legal/legal-layout";
import { legalConfig } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms of Service", description: "Terms governing use of the Recovra recovery intelligence platform." };

const { productName, legalEntity, governingLaw, contactEmail } = legalConfig;

const sections: LegalSection[] = [
  { id: "agreement", title: "1. Agreement", body: (
    <>
      <p>These Terms of Service (the &ldquo;Terms&rdquo;) govern access to and use of the {productName} platform, websites and related services (the &ldquo;Service&rdquo;) provided by {legalEntity} (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account, joining an organization workspace, or using the Service you agree to these Terms on behalf of yourself and, where applicable, the organization you represent (&ldquo;Customer&rdquo;).</p>
      <p>If a separate written agreement (for example an order form, master subscription agreement or data processing agreement) is signed between Customer and {legalEntity}, that agreement controls to the extent it conflicts with these Terms.</p>
    </>
  ) },
  { id: "service", title: "2. The Service", body: (
    <>
      <p>{productName} ingests invoices, rate sheets, contracts and operational records supplied by Customer, compares billed charges with the terms Customer has provided, and produces findings, evidence packages and recovery workflows. Findings are computed deterministically from the data supplied; where a model is used to transcribe documents, that fact and the read confidence are recorded and the resulting findings are flagged for human review.</p>
      <p><strong>Human decision-making.</strong> The Service does not submit claims, contact vendors, move money or alter vendor accounts on Customer&rsquo;s behalf. All such actions are taken by Customer&rsquo;s personnel after an approval step inside the Service. Customer remains responsible for verifying findings against source documents before relying on them.</p>
      <p><strong>No financial, legal or accounting advice.</strong> Outputs of the Service are informational tools for Customer&rsquo;s own review and do not constitute professional advice or a guarantee that any amount is owed or recoverable.</p>
    </>
  ) },
  { id: "accounts", title: "3. Accounts and organizations", body: (
    <>
      <p>Users must provide accurate information and keep credentials confidential. Each business object in the Service belongs to exactly one organization workspace; organization owners and admins control membership and roles. Customer is responsible for the acts of users it invites and for promptly removing users who should no longer have access.</p>
      <p>Customer must not share accounts, attempt to access another organization&rsquo;s data, probe or circumvent security controls, upload malicious code, or use the Service to violate law or third-party rights.</p>
    </>
  ) },
  { id: "customer-data", title: "4. Customer data", body: (
    <>
      <p>Customer retains all rights in the documents and data it uploads (&ldquo;Customer Data&rdquo;). Customer grants {legalEntity} a limited licence to host, process and display Customer Data solely to provide, secure and improve the Service for Customer and as described in our <Link href="/privacy">Privacy Policy</Link>.</p>
      <p>Customer represents that it has the rights and any required consents to upload Customer Data, including vendor invoices and contracts, and that doing so does not breach any confidentiality obligation.</p>
      <p>Customer Data is stored in tenant-isolated storage with row-level access controls, encrypted in transit and at rest, and retained until Customer deletes it or the account is closed, subject to backup retention windows described in the Privacy Policy.</p>
    </>
  ) },
  { id: "fees", title: "5. Fees", body: (
    <>
      <p>Fees, billing periods and any performance-based component (a percentage of verified, realized recoveries) are set out in the applicable order form or pricing page. Unless stated otherwise, fees are exclusive of taxes and are non-refundable. We may suspend access for accounts more than 30 days past due after written notice.</p>
    </>
  ) },
  { id: "acceptable-use", title: "6. Acceptable use and security", body: (
    <>
      <ul>
        <li>Do not reverse engineer, scrape or resell the Service except as permitted by law.</li>
        <li>Do not upload data you are not entitled to process, including personal data beyond what is contained in ordinary commercial invoices and shipping records.</li>
        <li>Report suspected vulnerabilities to <a href={`mailto:${contactEmail}`}>{contactEmail}</a>; do not exploit them.</li>
        <li>Respect rate limits and do not attempt to degrade the Service for other customers.</li>
      </ul>
    </>
  ) },
  { id: "ip", title: "7. Intellectual property", body: (
    <>
      <p>{legalEntity} and its licensors own the Service, including its rule engines, software, designs and documentation. Feedback you provide may be used without obligation. No rights are granted except as expressly stated in these Terms.</p>
    </>
  ) },
  { id: "warranty", title: "8. Disclaimers", body: (
    <>
      <p>THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo;. TO THE MAXIMUM EXTENT PERMITTED BY LAW, {legalEntity.toUpperCase()} DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT FINDINGS ARE COMPLETE, THAT ANY AMOUNT WILL BE RECOVERED, OR THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE.</p>
    </>
  ) },
  { id: "liability", title: "9. Limitation of liability", body: (
    <>
      <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEITHER PARTY WILL BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, OR LOST PROFITS OR REVENUE, ARISING FROM THESE TERMS. {legalEntity.toUpperCase()}&rsquo;S TOTAL LIABILITY ARISING FROM THE SERVICE WILL NOT EXCEED THE FEES PAID BY CUSTOMER IN THE TWELVE MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM. THESE LIMITS DO NOT APPLY TO A PARTY&rsquo;S BREACH OF CONFIDENTIALITY, INFRINGEMENT OF THE OTHER PARTY&rsquo;S INTELLECTUAL PROPERTY, OR LIABILITY THAT CANNOT BE LIMITED BY LAW.</p>
    </>
  ) },
  { id: "term", title: "10. Term, suspension and termination", body: (
    <>
      <p>These Terms apply while you use the Service. Either party may terminate for material breach not cured within 30 days of notice. We may suspend access immediately where necessary to protect the Service or other customers. On termination Customer may export its data for 30 days, after which we delete Customer Data from production systems within a further 30 days, subject to backup rotation and legal retention obligations.</p>
    </>
  ) },
  { id: "general", title: "11. General", body: (
    <>
      <p>These Terms are governed by the laws of {governingLaw}, without regard to conflict-of-law rules, and disputes will be brought in the courts located there. If any provision is unenforceable it will be modified to the minimum extent necessary. Neither party may assign these Terms without consent, except to a successor in a merger or sale of substantially all assets. We may update these Terms by posting a revised version with a new &ldquo;Last updated&rdquo; date; material changes will be notified inside the Service or by email.</p>
      <p>Questions about these Terms: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.</p>
    </>
  ) },
];

export default function TermsPage() {
  return <LegalLayout eyebrow="Legal" title="Terms of Service" intro={`The rules for using ${productName}: what the Service does, what stays under your control, and how we each limit risk.`} sections={sections}/>;
}
