import Link from "next/link";
import type { FindingDetail } from "@/lib/db/findings";
import { formatDate, formatDateTime, formatMoney, titleCase } from "@/lib/format";
import { RECOVERY_STATUS_LABELS, RECOVERY_TRANSITIONS, type RecoveryAction } from "@/lib/recovery/workflow";
import type { Organization } from "@/types/workspace";
import { PrintButton } from "./print-button";

type Trace = {
  formula?: string;
  operands?: Record<string, string>;
  ruleVersion?: string;
  matchedTerm?: { termId: string; contractId: string; key: string };
  sourceExtraction?: { provider: string; model: string; confidence: string };
};

export const CLAIM_READY_STATUSES = new Set(["approved", "submitted", "vendor_reviewing", "recovered"]);

/**
 * Printable dispute package for one approved finding. Every number on the page is read from the
 * persisted finding, its calculation trace and the approval record; nothing is recomputed here.
 */
export function ClaimPacket({ data, organization, generatedAt }: { data: FindingDetail; organization: Organization; generatedAt: string }) {
  const { finding, vendor, invoice, line, contract, documents, recovery, events, approvals } = data;
  const trace = finding.calculation_trace as Trace;
  const caseId = recovery ? `RC-${recovery.id.slice(0, 8).toUpperCase()}` : `F-${finding.id.slice(0, 8).toUpperCase()}`;
  const claimAmount = recovery?.approved_amount ?? recovery?.claimed_amount ?? finding.variance_amount;
  const approval = approvals.find((item) => item.status === "approved") ?? null;
  const documentById = new Map(documents.map((document) => [document.id, document]));
  const invoiceDocument = invoice?.source_document_id ? documentById.get(invoice.source_document_id) : undefined;
  const contractDocument = contract?.source_document_id ? documentById.get(contract.source_document_id) : undefined;

  return (
    <main className="claim-packet">
      <div className="claim-toolbar no-print">
        <Link href={`/opportunities/${finding.id}`}>← Back to finding</Link>
        <span>Print this page to PDF and attach it to your dispute email or vendor portal submission. Then record the submission on the finding.</span>
        <PrintButton/>
      </div>

      <header>
        <div>
          <span className="claim-kicker">Billing dispute / credit request</span>
          <h1>{organization.name}</h1>
          <p>Case {caseId} · Prepared {formatDateTime(generatedAt)}</p>
        </div>
        <div className="claim-amount">
          <span>Credit requested</span>
          <strong>{formatMoney(claimAmount, finding.currency, { cents: true })}</strong>
          <small>{recovery?.approved_amount ? `Approved internally${approval?.decided_at ? ` on ${formatDate(approval.decided_at)}` : ""}` : "Deterministic variance"}</small>
        </div>
      </header>

      <section className="claim-parties">
        <div><span>To</span><strong>{vendor?.name ?? "Vendor"}</strong><small>Accounts receivable / billing disputes</small></div>
        <div><span>From</span><strong>{organization.name}</strong><small>Accounts payable · Recovra case {caseId}</small></div>
        <div><span>Invoice</span><strong>{invoice?.invoice_number ?? "—"}</strong><small>{invoice?.invoice_date ? `Dated ${formatDate(invoice.invoice_date)} · ` : ""}Total {invoice ? formatMoney(invoice.total, invoice.currency, { cents: true }) : "—"}</small></div>
      </section>

      <section className="claim-letter">
        <p>To the billing team at {vendor?.name ?? "the vendor"},</p>
        <p>
          During our audit of invoice <strong>{invoice?.invoice_number ?? "—"}</strong> we identified a discrepancy of <strong>{formatMoney(finding.variance_amount, finding.currency, { cents: true })}</strong>
          {line ? <> on line {line.line_number} ({line.charge_code}{line.dimensions?.reference ? `, reference ${line.dimensions.reference}` : ""})</> : null}.
          {" "}{finding.description}
        </p>
        <p>
          We request a credit of <strong>{formatMoney(claimAmount, finding.currency, { cents: true })}</strong> against this invoice, or a corrected invoice. The calculation, the contractual basis and the source records are set out below. Please reply with the credit note number or your reasons for disagreement within your standard dispute window.
        </p>
      </section>

      <section className="claim-grid">
        <article>
          <h2>Calculation</h2>
          <table>
            <tbody>
              <tr><th>Billed</th><td>{formatMoney(finding.billed_amount, finding.currency, { cents: true })}</td></tr>
              <tr><th>Expected</th><td>{finding.expected_amount === null ? "Not determinable" : formatMoney(finding.expected_amount, finding.currency, { cents: true })}</td></tr>
              <tr><th>Variance</th><td><strong>{formatMoney(finding.variance_amount, finding.currency, { cents: true })}</strong></td></tr>
              <tr><th>Rule</th><td>{trace.ruleVersion ?? finding.rule_version ?? "—"}</td></tr>
              {trace.formula && <tr><th>Formula</th><td><code>{trace.formula}</code></td></tr>}
              {trace.operands && <tr><th>Inputs</th><td>{Object.entries(trace.operands).map(([key, value]) => <span key={key} className="operand">{key} = {value}</span>)}</td></tr>}
            </tbody>
          </table>
          {trace.sourceExtraction && <p className="claim-caveat">Invoice rows were transcribed from the PDF by {trace.sourceExtraction.provider}/{trace.sourceExtraction.model} and verified by {organization.name} before approval.</p>}
        </article>

        <article>
          <h2>Contractual basis</h2>
          {contract ? (
            <table>
              <tbody>
                <tr><th>Agreement</th><td>{contract.title}</td></tr>
                <tr><th>Effective</th><td>{contract.effective_from ? formatDate(contract.effective_from) : "—"}{contract.effective_to ? ` – ${formatDate(contract.effective_to)}` : ""}</td></tr>
                {trace.matchedTerm && <tr><th>Matched term</th><td><code>{trace.matchedTerm.key}</code></td></tr>}
                {contractDocument && <tr><th>Source file</th><td>{contractDocument.filename}{contractDocument.sha256 ? <small> · SHA-256 {contractDocument.sha256}</small> : null}</td></tr>}
              </tbody>
            </table>
          ) : (
            <p>{finding.category === "duplicate_charge" || finding.category === "duplicate_invoice" ? "No contract term is required: the charge duplicates an amount already billed (see evidence)." : "This finding is based on invoice data alone; the applicable agreement is referenced in the description."}</p>
          )}
        </article>
      </section>

      <section className="claim-section">
        <h2>Evidence</h2>
        <table className="claim-table">
          <thead><tr><th>#</th><th>Type</th><th>Document</th><th>Location</th><th>Fingerprint (SHA-256)</th></tr></thead>
          <tbody>
            {finding.evidence.map((reference, index) => {
              const document = documentById.get(reference.documentId);
              return (
                <tr key={`${reference.documentId}-${reference.locator}-${index}`}>
                  <td>{index + 1}</td>
                  <td>{titleCase(reference.kind)}</td>
                  <td>{document?.filename ?? reference.label}</td>
                  <td>{reference.label} · {reference.locator}</td>
                  <td><code>{document?.sha256 ?? "—"}</code></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {line && (
          <table className="claim-table">
            <thead><tr><th>Line</th><th>Charge</th><th>Description</th><th>Reference</th><th>Qty</th><th>Unit price</th><th>Billed</th></tr></thead>
            <tbody>
              <tr>
                <td>{line.line_number}</td><td>{line.charge_code}</td><td>{line.description}</td><td>{line.dimensions?.reference ?? "—"}</td>
                <td>{line.quantity ?? "—"} {line.unit ?? ""}</td><td>{line.unit_price ? formatMoney(line.unit_price, finding.currency, { cents: true }) : "—"}</td><td>{formatMoney(line.billed_amount, finding.currency, { cents: true })}</td>
              </tr>
            </tbody>
          </table>
        )}
        {invoiceDocument && <p className="claim-caveat">Source invoice file: {invoiceDocument.filename}{invoiceDocument.sha256 ? ` · SHA-256 ${invoiceDocument.sha256}` : ""}. Original files are retained by {organization.name} and available on request.</p>}
      </section>

      <section className="claim-section">
        <h2>Internal approval trail</h2>
        <table className="claim-table">
          <thead><tr><th>When</th><th>Step</th><th>By</th><th>Note</th></tr></thead>
          <tbody>
            <tr><td>{formatDateTime(finding.created_at)}</td><td>Finding detected by rule engine</td><td>Recovra ({trace.ruleVersion ?? finding.rule_version ?? "rules"})</td><td>Deterministic calculation; no estimate involved.</td></tr>
            {events.filter((event) => event.event_type !== "detected").map((event) => (
              <tr key={event.id}>
                <td>{formatDateTime(event.created_at)}</td>
                <td>{RECOVERY_TRANSITIONS[event.event_type as RecoveryAction]?.label ?? titleCase(event.event_type)}</td>
                <td>{event.actorName ?? "System"}</td>
                <td>{typeof event.details?.note === "string" ? event.details.note : ""}{typeof event.details?.amount === "string" ? ` Amount ${formatMoney(event.details.amount, finding.currency, { cents: true })}` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="claim-caveat">Current status: {RECOVERY_STATUS_LABELS[recovery?.status ?? "detected"] ?? recovery?.status ?? "detected"}. This package was approved by a person before it was generated; Recovra does not send claims automatically.</p>
      </section>

      <footer>
        <span>Generated by Recovra for {organization.name} · {formatDateTime(generatedAt)} · Case {caseId} · Finding {finding.id}</span>
      </footer>
    </main>
  );
}
