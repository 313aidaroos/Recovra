import Link from "next/link";
import { ArrowRight, FileCheck2, FileText, RefreshCw, ShieldCheck } from "lucide-react";
import type { InvoiceDetail as InvoiceDetailData } from "@/lib/db/resources";
import { formatDate, formatDateTime, formatMoney, titleCase } from "@/lib/format";
import { reauditInvoiceAction } from "@/lib/ingestion/actions";
import { isZero, sumDecimals } from "@/lib/recovery-engine";
import { WRITER_ROLES, type OrganizationRole } from "@/types/workspace";
import { StatusBadge } from "../ui/status-badge";

export function InvoiceDetail({ data, role, documentUrl }: { data: InvoiceDetailData; role: OrganizationRole; documentUrl: string | null }) {
  const { invoice, vendor, document, lines, findings } = data;
  const active = findings.filter((finding) => finding.status !== "dismissed");
  const variance = sumDecimals(active.map((finding) => finding.variance_amount));
  const findingsByLine = new Map<string, typeof findings>();
  for (const finding of active) {
    if (!finding.invoice_line_id) continue;
    findingsByLine.set(finding.invoice_line_id, [...(findingsByLine.get(finding.invoice_line_id) ?? []), finding]);
  }
  const invoiceLevel = active.filter((finding) => !finding.invoice_line_id);
  const vendorName = vendor?.name ?? "Unknown vendor";
  const number = invoice.invoice_number ?? invoice.id.slice(0, 8);
  const canReaudit = WRITER_ROLES.includes(role);

  return (
    <>
      <section className="detail-hero">
        <div>
          <span className="breadcrumb"><Link href="/invoices">Invoices</Link> <ArrowRight size={12}/> {number}</span>
          <div className="detail-title"><span className="vendor-monogram large">{vendorName.slice(0, 2).toUpperCase()}</span><div><h1>{number}</h1><p>{vendorName} · {formatDate(invoice.invoice_date)} · Ingested {formatDateTime(invoice.created_at)}</p></div></div>
        </div>
        <div className="detail-actions">
          <StatusBadge tone={invoice.status === "findings" ? "warn" : invoice.status === "clean" ? "good" : "neutral"}>{titleCase(invoice.status)}</StatusBadge>
          {canReaudit && (
            <form action={reauditInvoiceAction}>
              <input type="hidden" name="invoice_id" value={invoice.id}/>
              <button className="secondary-button tall" type="submit"><RefreshCw size={15}/> Re-run audit</button>
            </form>
          )}
        </div>
      </section>
      <section className="detail-metrics">
        <div><span>Invoice amount</span><strong>{formatMoney(invoice.total, invoice.currency, { cents: true })}</strong><small>Sum of {lines.length} billed line{lines.length === 1 ? "" : "s"}</small></div>
        <div><span>Variance found</span><strong className={isZero(variance) ? undefined : "money-good"}>{formatMoney(variance, invoice.currency, { cents: true })}</strong><small>{active.length} open finding{active.length === 1 ? "" : "s"}</small></div>
        <div><span>Lines audited</span><strong>{lines.length}</strong><small>{lines.filter((line) => findingsByLine.has(line.id)).length} with findings</small></div>
        <div><span>Audit state</span><strong>{titleCase(invoice.status)}</strong><small>Deterministic rule set · fixed-point math</small></div>
      </section>
      <section className="detail-layout">
        <div className="detail-main">
          <article className="panel">
            <div className="panel-title-row"><div><span className="panel-kicker">Line-level audit</span><h3>Charges and expected cost</h3></div><span className="sample-label live">Live data</span></div>
            <div className="table-wrap"><table><thead><tr><th>Line</th><th>Charge</th><th>Lane / dimensions</th><th>Qty</th><th>Billed rate</th><th>Billed</th><th>Expected</th><th>Variance</th></tr></thead><tbody>
              {lines.length === 0 && <tr><td colSpan={8} className="table-empty">No lines were read from this invoice.</td></tr>}
              {lines.map((line) => {
                const mine = findingsByLine.get(line.id) ?? [];
                const expected = mine.find((finding) => finding.expected_amount !== null)?.expected_amount ?? null;
                const lineVariance = sumDecimals(mine.map((finding) => finding.variance_amount));
                const dimensions = Object.entries(line.dimensions ?? {}).filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`).join(" · ");
                return (
                  <tr key={line.id} className={mine.length > 0 ? "highlight" : undefined}>
                    <td>{line.line_number ?? line.external_line_id ?? "—"}</td>
                    <td><strong>{line.charge_code ?? "—"}</strong><small className="cell-sub">{line.description}</small>{mine.map((finding) => <small className="cell-sub" key={finding.id}><Link href={`/opportunities/${finding.id}`}>{finding.title}</Link></small>)}</td>
                    <td><span className="muted">{dimensions || "—"}</span></td>
                    <td>{line.quantity ?? "—"}{line.unit ? ` ${line.unit}` : ""}</td>
                    <td>{line.unit_price ? formatMoney(line.unit_price, invoice.currency, { cents: true }) : "—"}</td>
                    <td>{formatMoney(line.billed_amount, invoice.currency, { cents: true })}</td>
                    <td>{mine.length === 0 ? <span className="muted">Matches terms</span> : expected === null ? <span className="muted">Needs review</span> : formatMoney(expected, invoice.currency, { cents: true })}</td>
                    <td className={isZero(lineVariance) ? undefined : "money-good"}>{formatMoney(lineVariance, invoice.currency, { cents: true })}</td>
                  </tr>
                );
              })}
            </tbody></table></div>
          </article>
          {invoiceLevel.length > 0 && (
            <article className="panel">
              <div className="panel-title-row"><div><span className="panel-kicker">Invoice-level findings</span><h3>Duplicate and header checks</h3></div></div>
              <div className="action-list">
                {invoiceLevel.map((finding) => <Link href={`/opportunities/${finding.id}`} key={finding.id}><ShieldCheck size={17}/><div><strong>{finding.title}</strong><small>{titleCase(finding.category)} · {titleCase(finding.severity)}</small></div><strong className="money-good">{formatMoney(finding.variance_amount, finding.currency, { cents: true })}</strong></Link>)}
              </div>
            </article>
          )}
        </div>
        <aside className="detail-side">
          <article className="panel">
            <span className="panel-kicker">Audit lineage</span>
            <div className="action-list">
              <div className="resource-line"><FileText size={16}/><div><strong>Source document</strong><small>{document ? (documentUrl ? <a className="text-link" href={documentUrl} target="_blank" rel="noreferrer">{document.filename}</a> : document.filename) : "Not linked"}{document?.sha256 ? ` · SHA-256 ${document.sha256.slice(0, 12)}…` : ""}</small></div></div>
              <div className="resource-line"><FileCheck2 size={16}/><div><strong>Vendor</strong><small><Link className="text-link" href="/vendors">{vendorName}</Link>{vendor?.category ? ` · ${titleCase(vendor.category)}` : ""}</small></div></div>
              <div className="resource-line"><ShieldCheck size={16}/><div><strong>Findings</strong><small>{active.length} open · {findings.length - active.length} dismissed</small></div></div>
            </div>
          </article>
          <article className="panel">
            <span className="panel-kicker">Findings on this invoice</span>
            <div className="opportunity-stack">
              {active.length === 0 && <p className="muted-note">No variance detected against active contract terms.</p>}
              {active.map((finding) => <Link href={`/opportunities/${finding.id}`} key={finding.id}><span className="vendor-monogram">{finding.severity.slice(0, 1).toUpperCase()}</span><div><strong>{finding.title}</strong><small>{titleCase(finding.category)}</small></div><div className="stack-value"><strong>{formatMoney(finding.variance_amount, finding.currency, { cents: true })}</strong><small>{finding.recoverability === "recoverable" ? "Verified quality" : "Needs review"}</small></div></Link>)}
            </div>
          </article>
        </aside>
      </section>
    </>
  );
}
