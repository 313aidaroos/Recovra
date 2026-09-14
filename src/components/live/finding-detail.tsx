import Link from "next/link";
import { ArrowRight, Bot, Calculator, CheckCircle2, Clock3, FileCheck2, FileText, LockKeyhole, Printer, ScanLine, ShieldCheck } from "lucide-react";
import type { FindingDetail as FindingDetailData } from "@/lib/db/findings";
import { formatDate, formatDateTime, formatMoney, formatPercent, titleCase } from "@/lib/format";
import { availableActions, RECOVERY_STATUS_LABELS, RECOVERY_TRANSITIONS, type RecoveryAction } from "@/lib/recovery/workflow";
import type { OrganizationRole } from "@/types/workspace";
import { StatusBadge } from "../ui/status-badge";
import { CLAIM_READY_STATUSES } from "./claim-packet";
import { RecoveryActionPanel } from "./recovery-action-panel";

type Trace = {
  formula?: string;
  operands?: Record<string, string>;
  expectedAmount?: string | null;
  billedAmount?: string;
  varianceAmount?: string;
  ruleVersion?: string;
  matchedTerm?: { termId: string; contractId: string; key: string };
  sourceExtraction?: { provider: string; model: string; confidence: string; confidenceCapApplied: boolean };
};

export function FindingDetail({ data, role, documentLinks }: { data: FindingDetailData; role: OrganizationRole; documentLinks: Record<string, string | null> }) {
  const { finding, vendor, invoice, line, contract, documents, recovery, events, approvals, siblingLines } = data;
  const trace = finding.calculation_trace as Trace;
  const status = recovery?.status ?? "detected";
  const statusLabel = RECOVERY_STATUS_LABELS[status] ?? status;
  const actions = recovery ? availableActions(status, role) : [];
  const vendorName = vendor?.name ?? "Unknown vendor";
  const documentById = new Map(documents.map((document) => [document.id, document]));
  const affectedLines = line ? siblingLines.filter((candidate) => candidate.id === line.id || (candidate.charge_code === line.charge_code && candidate.dimensions?.reference && candidate.dimensions.reference === line.dimensions?.reference)).slice(0, 25) : siblingLines.slice(0, 10);

  return (
    <>
      <section className="detail-hero">
        <div>
          <span className="breadcrumb"><Link href="/opportunities">Recovery Opportunities</Link> <ArrowRight size={12}/> {finding.id.slice(0, 8)}</span>
          <div className="detail-title"><span className="vendor-monogram large">{vendorName.slice(0, 2).toUpperCase()}</span><div><h1>{finding.title}</h1><p>{vendorName} · {titleCase(finding.module)} · {titleCase(finding.category)} · Detected {formatDate(finding.created_at)}</p></div></div>
        </div>
        <div className="detail-actions"><StatusBadge>{statusLabel}</StatusBadge><StatusBadge tone={finding.recoverability === "recoverable" ? "good" : "warn"}>{finding.recoverability === "recoverable" ? "Verified quality" : "Needs review"}</StatusBadge></div>
      </section>

      <section className="detail-metrics">
        <div><span>Potential recovery</span><strong className="money-good">{formatMoney(finding.variance_amount, finding.currency, { cents: true })}</strong><small>Deterministic variance</small></div>
        <div><span>Confidence</span><strong>{formatPercent(finding.confidence)}</strong><small>{Number(finding.confidence) >= 0.9 ? "High confidence" : "Review recommended"}</small></div>
        <div><span>Evidence</span><strong>{finding.evidence.length} items</strong><small>{documents.length} source document{documents.length === 1 ? "" : "s"}</small></div>
        <div><span>Severity</span><strong>{titleCase(finding.severity)}</strong><small>Financial impact</small></div>
      </section>

      <section className="detail-layout">
        <div className="detail-main">
          <article className="panel explanation-panel">
            <div className="panel-title-row"><div><span className="panel-kicker">Finding explanation</span><h3>What Recovra found</h3></div><span className="ai-label"><Bot size={14}/> Rule-generated explanation · amounts from calculation trace</span></div>
            <p>{finding.description}</p>
            <div className="calculation-strip">
              <div><small>Billed amount</small><strong>{formatMoney(finding.billed_amount, finding.currency, { cents: true })}</strong></div><span>−</span>
              <div><small>Expected amount</small><strong>{finding.expected_amount === null ? "Not determinable" : formatMoney(finding.expected_amount, finding.currency, { cents: true })}</strong></div><span>=</span>
              <div className="variance"><small>Variance detected</small><strong>{formatMoney(finding.variance_amount, finding.currency, { cents: true })}</strong></div>
            </div>
            <div className="rule-trace"><Calculator size={17}/><div><strong>Rule: {trace.ruleVersion ?? finding.rule_version}</strong><small>{trace.formula}</small>{trace.operands && <small className="operands">{Object.entries(trace.operands).map(([key, value]) => `${key} = ${value}`).join(" · ")}</small>}</div><StatusBadge tone="good">Traced</StatusBadge></div>
            {trace.sourceExtraction && (
              <div className="extraction-notice"><ScanLine size={16}/><div><strong>Rows transcribed from a PDF by {trace.sourceExtraction.provider}/{trace.sourceExtraction.model}</strong><small>Read confidence {Math.round(Number(trace.sourceExtraction.confidence) * 100)}%. The arithmetic above is deterministic, but the inputs came from a model reading the page. Open the source document below and confirm the billed line before approving a claim.</small></div></div>
            )}
          </article>

          <article className="panel">
            <div className="panel-title-row"><div><span className="panel-kicker">Evidence package</span><h3>Sources supporting this finding</h3></div><span className="evidence-count">{finding.evidence.length} linked records</span></div>
            <div className="evidence-grid">
              {finding.evidence.map((reference, index) => {
                const document = documentById.get(reference.documentId);
                const href = documentLinks[reference.documentId];
                return (
                  <div key={`${reference.documentId}-${reference.locator}-${index}`}>
                    <span>{reference.kind === "invoice" ? <FileText size={18}/> : <FileCheck2 size={18}/>}</span>
                    <div><small>{titleCase(reference.kind)}</small><strong>{document?.filename ?? reference.label}</strong><p>{reference.label} · {reference.locator}{document?.sha256 ? ` · sha256 ${document.sha256.slice(0, 10)}…` : ""}</p></div>
                    {href ? <a href={href} target="_blank" rel="noreferrer" aria-label="Open source document"><ArrowRight size={15}/></a> : <button aria-label="Document unavailable" disabled><ArrowRight size={15}/></button>}
                  </div>
                );
              })}
            </div>
            {contract && (
              <blockquote className="clause-quote"><span>Contract / rate source</span>{contract.title}{trace.matchedTerm ? ` · matched term ${trace.matchedTerm.key}` : ""}<cite><Link href={`/contracts/${contract.id}`}>Open contract terms</Link>{contract.effective_from ? ` · effective ${formatDate(contract.effective_from)}` : ""}{contract.effective_to ? ` – ${formatDate(contract.effective_to)}` : ""}</cite></blockquote>
            )}
          </article>

          <article className="panel">
            <div className="panel-title-row"><div><span className="panel-kicker">Affected charges</span><h3>Invoice lines</h3></div>{invoice && <Link href={`/invoices/${invoice.id}`} className="text-button">Open invoice {invoice.invoice_number ?? ""} <ArrowRight size={14}/></Link>}</div>
            <div className="table-wrap"><table><thead><tr><th>Line</th><th>Charge</th><th>Reference</th><th>Qty</th><th>Unit price</th><th>Billed</th><th>Source</th></tr></thead><tbody>
              {affectedLines.length === 0 && <tr><td colSpan={7} className="table-empty">Invoice-level finding; see the invoice for all lines.</td></tr>}
              {affectedLines.map((row) => (
                <tr key={row.id} className={row.id === line?.id ? "highlight" : undefined}>
                  <td>{row.line_number}</td>
                  <td><strong>{row.charge_code}</strong><small className="cell-sub">{row.description}</small></td>
                  <td>{row.dimensions?.reference ?? "—"}</td>
                  <td>{row.quantity ?? "—"} {row.unit ?? ""}</td>
                  <td>{row.unit_price ? formatMoney(row.unit_price, finding.currency, { cents: true }) : "—"}</td>
                  <td className={row.id === line?.id ? "money-good" : undefined}>{formatMoney(row.billed_amount, finding.currency, { cents: true })}</td>
                  <td>{String(row.source_locator?.locator ?? "")}</td>
                </tr>
              ))}
            </tbody></table></div>
          </article>
        </div>

        <aside className="detail-side">
          {recovery ? (
            <RecoveryActionPanel recoveryId={recovery.id} actions={actions} currency={finding.currency} claimedAmount={recovery.claimed_amount} approvedAmount={recovery.approved_amount} recoverability={finding.recoverability}/>
          ) : (
            <article className="panel action-card"><span className="panel-kicker">Recovery case</span><h3>No case opened</h3><p>Re-run the audit on the invoice to open a recovery case for this finding.</p></article>
          )}

          <article className="panel claim-draft">
            <div className="panel-title-row"><div><span className="panel-kicker">Claim draft</span><h3>Vendor review request</h3></div><StatusBadge tone={status === "approved" || status === "submitted" ? "good" : "neutral"}>{status === "approved" ? "Approved" : status === "submitted" ? "Sent by you" : "Draft"}</StatusBadge></div>
            <p><strong>Subject:</strong> Review request for invoice {invoice?.invoice_number ?? "—"}</p>
            <p>We identified a {formatMoney(finding.variance_amount, finding.currency, { cents: true })} discrepancy on {vendorName} invoice {invoice?.invoice_number ?? ""}: {finding.description} The attached package includes the source rows, the contracted term and the calculation trace ({trace.ruleVersion ?? finding.rule_version}).</p>
            {recovery?.approved_amount && <p><strong>Approved amount:</strong> {formatMoney(recovery.approved_amount, finding.currency, { cents: true })}</p>}
            {recovery?.realized_amount && <p><strong>Recovered:</strong> {formatMoney(recovery.realized_amount, finding.currency, { cents: true })}</p>}
            {CLAIM_READY_STATUSES.has(status)
              ? <Link className="secondary-button tall claim-link" href={`/claims/${finding.id}`}><Printer size={15}/> Open claim packet</Link>
              : <p className="muted-note"><LockKeyhole size={13}/> The printable claim packet unlocks once an approver authorises the amount.</p>}
          </article>

          <article className="panel timeline">
            <span className="panel-kicker">Activity timeline</span>
            <div><i className="complete"><ShieldCheck size={13}/></i><p><strong>Finding detected by rule engine</strong><small>{trace.ruleVersion ?? finding.rule_version} · {formatDateTime(finding.created_at)}</small></p></div>
            {events.filter((event) => event.event_type !== "detected").map((event) => (
              <div key={event.id}><i className="complete"><CheckCircle2 size={13}/></i><p><strong>{RECOVERY_TRANSITIONS[event.event_type as RecoveryAction]?.label ?? titleCase(event.event_type)}</strong><small>{event.actorName ?? "System"} · {formatDateTime(event.created_at)}{typeof event.details?.note === "string" && event.details.note ? ` · ${event.details.note}` : ""}</small></p></div>
            ))}
            {approvals.some((approval) => approval.status === "pending") && <div><i><Clock3 size={13}/></i><p><strong>Awaiting approver decision</strong><small>Owner, admin or finance role required</small></p></div>}
          </article>
        </aside>
      </section>
    </>
  );
}
