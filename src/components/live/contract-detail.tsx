import Link from "next/link";
import { ArrowRight, FileText, ShieldCheck } from "lucide-react";
import type { ContractDetail as ContractDetailData } from "@/lib/db/resources";
import { formatDate, formatDateTime, formatMoney, formatPercent, titleCase } from "@/lib/format";
import { StatusBadge } from "../ui/status-badge";

type TermValue = {
  chargeCode?: string;
  dimensions?: Record<string, string>;
  rate?: string;
  basis?: string;
  unit?: string;
  percent?: string;
  percentBasisCodes?: string[];
  freeDays?: string;
  minimum?: string;
  currency?: string;
  clause?: string;
};

function describeTerm(termType: string, value: TermValue, currency: string) {
  switch (termType) {
    case "rate": return `${formatMoney(value.rate ?? "0", value.currency ?? currency, { cents: true })} ${value.basis === "flat" ? "flat" : `per ${value.unit ?? "unit"}`}${value.minimum ? ` · min ${formatMoney(value.minimum, value.currency ?? currency, { cents: true })}` : ""}`;
    case "percent": return `${formatPercent(value.percent ? String(Number(value.percent) / 100) : null)} of ${value.percentBasisCodes?.length ? value.percentBasisCodes.join(", ") : "base freight"}`;
    case "free_time": return `${value.freeDays ?? "0"} free day${value.freeDays === "1" ? "" : "s"}${value.rate ? ` · then ${formatMoney(value.rate, value.currency ?? currency, { cents: true })}/day` : ""}`;
    case "allowed_charge": return "Approved accessorial";
    default: return termType;
  }
}

export function ContractDetail({ data, documentUrl }: { data: ContractDetailData; documentUrl: string | null }) {
  const { contract, vendor, document, terms, findings } = data;
  const vendorName = vendor?.name ?? "Unknown vendor";
  const byType = new Map<string, number>();
  for (const term of terms) byType.set(term.term_type, (byType.get(term.term_type) ?? 0) + 1);

  return (
    <>
      <section className="detail-hero">
        <div>
          <span className="breadcrumb"><Link href="/contracts">Contracts</Link> <ArrowRight size={12}/> {contract.title}</span>
          <div className="detail-title"><span className="vendor-monogram large">{vendorName.slice(0, 2).toUpperCase()}</span><div><h1>{contract.title}</h1><p>{vendorName} · Effective {formatDate(contract.effective_from)}{contract.effective_to ? ` to ${formatDate(contract.effective_to)}` : ""} · Loaded {formatDateTime(contract.created_at)}</p></div></div>
        </div>
        <div className="detail-actions"><StatusBadge tone={contract.status === "active" ? "good" : "neutral"}>{titleCase(contract.status)}</StatusBadge></div>
      </section>
      <section className="detail-metrics">
        <div><span>Contract terms</span><strong>{terms.length}</strong><small>{[...byType.entries()].map(([type, count]) => `${count} ${titleCase(type).toLowerCase()}`).join(" · ") || "No terms parsed"}</small></div>
        <div><span>Currency</span><strong>{contract.currency}</strong><small>Applied to every audit comparison</small></div>
        <div><span>Findings referencing this agreement</span><strong>{findings.length}</strong><small>Most recent 50</small></div>
        <div><span>Status</span><strong>{titleCase(contract.status)}</strong><small>{contract.status === "active" ? "Used by the audit engine" : "Superseded by a newer upload"}</small></div>
      </section>
      <section className="detail-layout">
        <div className="detail-main">
          <article className="panel">
            <div className="panel-title-row"><div><span className="panel-kicker">Rate table</span><h3>Contracted terms</h3></div><span className="sample-label live">Live data</span></div>
            <div className="table-wrap"><table><thead><tr><th>Charge</th><th>Type</th><th>Lane / dimensions</th><th>Term</th><th>Source row</th><th>Clause</th></tr></thead><tbody>
              {terms.length === 0 && <tr><td colSpan={6} className="table-empty">No terms were parsed from this document.</td></tr>}
              {terms.map((term) => {
                const value = term.value as TermValue;
                const dimensions = Object.entries(value.dimensions ?? {}).filter(([, item]) => item).map(([key, item]) => `${key}: ${item}`).join(" · ");
                return (
                  <tr key={term.id}>
                    <td><strong>{value.chargeCode ?? "—"}</strong></td>
                    <td><span className="module-pill">{titleCase(term.term_type)}</span></td>
                    <td><span className="muted">{dimensions || "Any lane"}</span></td>
                    <td>{describeTerm(term.term_type, value, contract.currency)}</td>
                    <td><span className="muted">{String(term.source_locator?.locator ?? "—")}</span></td>
                    <td><span className="muted">{value.clause ?? "—"}</span></td>
                  </tr>
                );
              })}
            </tbody></table></div>
          </article>
        </div>
        <aside className="detail-side">
          <article className="panel">
            <span className="panel-kicker">Provenance</span>
            <div className="action-list">
              <div className="resource-line"><FileText size={16}/><div><strong>Source document</strong><small>{document ? (documentUrl ? <a className="text-link" href={documentUrl} target="_blank" rel="noreferrer">{document.filename}</a> : document.filename) : "Not linked"}{document?.sha256 ? ` · SHA-256 ${document.sha256.slice(0, 12)}…` : ""}</small></div></div>
              <div className="resource-line"><ShieldCheck size={16}/><div><strong>Deterministic matching</strong><small>Most specific lane wins: mode, origin, destination, equipment, service level.</small></div></div>
            </div>
          </article>
          <article className="panel">
            <span className="panel-kicker">Findings against this agreement</span>
            <div className="opportunity-stack">
              {findings.length === 0 && <p className="muted-note">No invoice has deviated from these terms yet.</p>}
              {findings.map((finding) => <Link href={`/opportunities/${finding.id}`} key={finding.id}><span className="vendor-monogram">{finding.severity.slice(0, 1).toUpperCase()}</span><div><strong>{finding.title}</strong><small>{titleCase(finding.category)}</small></div><div className="stack-value"><strong>{formatMoney(finding.variance_amount, finding.currency, { cents: true })}</strong></div></Link>)}
            </div>
          </article>
        </aside>
      </section>
    </>
  );
}
