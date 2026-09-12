import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronRight, FileText, ShieldAlert, Sparkles, UploadCloud } from "lucide-react";
import type { DashboardData } from "@/lib/db/dashboard";
import { formatCompactMoney, formatDateTime, formatMoney, formatPercent, titleCase } from "@/lib/format";
import { StatusBadge } from "../ui/status-badge";
import { EmptyState } from "./empty-state";

function describeActivity(action: string, metadata: Record<string, unknown>) {
  switch (action) {
    case "document.uploaded": return `Uploaded ${String(metadata.filename ?? "a document")}`;
    case "invoice.ingested": return `Ingested invoice ${String(metadata.invoiceNumber ?? "")} · ${String(metadata.lines ?? 0)} lines`;
    case "contract.ingested": return `Loaded rate sheet ${String(metadata.title ?? "")} · ${String(metadata.terms ?? 0)} terms`;
    case "audit.completed": return `Audit completed · ${String(metadata.findings ?? 0)} finding(s)`;
    case "organization.created": return "Workspace created";
    case "member.upserted": return `Member added · ${String(metadata.email ?? "")}`;
    default: return titleCase(action.replace("recovery.", "Recovery: "));
  }
}

export function LiveDashboard({ data, organizationName, currency }: { data: DashboardData; organizationName: string; currency: string }) {
  const { metrics } = data;
  const hasData = metrics.invoiceCount > 0 || metrics.documentCount > 0;
  const maxMonthly = Math.max(1, ...data.monthlyVariance.map((point) => Number(point.amount)));
  const maxPipeline = Math.max(1, ...data.pipeline.map((stage) => Number(stage.amount)));

  return (
    <>
      <section className="page-heading">
        <div>
          <span className="eyebrow"><Sparkles size={14}/> {organizationName}</span>
          <h1>Command Center</h1>
          <p>Live tenant data. Every amount below is computed deterministically from your uploaded invoices, rate sheets and approvals.</p>
        </div>
        <div className="heading-controls">
          <Link className="primary-button" href="/documents"><UploadCloud size={15}/> Upload documents</Link>
        </div>
      </section>

      <section className="metrics-grid">
        <article className="metric-card"><div className="metric-head"><span>Total spend monitored</span></div><strong>{formatMoney(metrics.monitored, currency)}</strong><small>{metrics.invoiceCount} invoice{metrics.invoiceCount === 1 ? "" : "s"} · {metrics.vendorCount} vendor{metrics.vendorCount === 1 ? "" : "s"}</small></article>
        <article className="metric-card warn"><div className="metric-head"><span>Recovery opportunities</span></div><strong>{formatMoney(metrics.found, currency)}</strong><small>Verified-quality variance · {formatMoney(metrics.needsReview, currency)} more needs review</small></article>
        <article className="metric-card good"><div className="metric-head"><span>Recovered</span></div><strong>{formatMoney(metrics.recovered, currency)}</strong><small>Realized credits recorded by approvers</small></article>
        <article className="metric-card good"><div className="metric-head"><span>Approved · awaiting vendor</span></div><strong>{formatMoney(metrics.approved, currency)}</strong><small>{metrics.pendingApprovalCount} claim{metrics.pendingApprovalCount === 1 ? "" : "s"} waiting for approval</small></article>
      </section>

      {!hasData && (
        <EmptyState
          title="Load your first rate sheet and invoice"
          description="Upload a vendor rate sheet (CSV/XLSX) and then an invoice file. Recovra audits every line against contracted rates, fuel percentages and free-time terms and opens recovery cases for each finding."
        />
      )}

      <section className="command-grid">
        <article className="panel trend-panel">
          <div className="panel-title-row">
            <div><span className="panel-kicker">Variance detected</span><h3>Findings by month</h3></div>
            <span className="chip good">{metrics.openFindingCount} open</span>
          </div>
          {data.monthlyVariance.length === 0 ? (
            <p className="muted-note">No findings yet. Monthly variance appears here after your first audit.</p>
          ) : (
            <div className="bar-chart" aria-label="Variance detected per month">
              {data.monthlyVariance.map((point) => (
                <div key={point.month} className="bar-column">
                  <span style={{ height: `${Math.max(4, Math.round((Number(point.amount) / maxMonthly) * 100))}%` }} title={formatMoney(point.amount, currency)}/>
                  <small>{point.month.slice(5)}/{point.month.slice(2, 4)}</small>
                  <strong>{formatCompactMoney(point.amount, currency)}</strong>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel top-opportunities">
          <div className="panel-title-row">
            <div><span className="panel-kicker">Priority queue</span><h3>Top recovery opportunities</h3></div>
            <Link href="/opportunities">View all <ArrowRight size={15}/></Link>
          </div>
          <div className="opportunity-stack">
            {data.topFindings.length === 0 && <p className="muted-note">Findings will rank here by recoverable value.</p>}
            {data.topFindings.slice(0, 5).map((row) => (
              <Link href={`/opportunities/${row.id}`} key={row.id}>
                <span className="vendor-monogram">{row.vendor.slice(0, 2).toUpperCase()}</span>
                <div><strong>{row.vendor}</strong><small>{row.title}</small></div>
                <div className="stack-value"><strong>{formatMoney(row.variance, row.currency)}</strong><small>{formatPercent(row.confidence)} confidence</small></div>
              </Link>
            ))}
          </div>
        </article>
      </section>

      {data.topFindings.length > 0 && (
        <section className="panel opportunities-panel command-opportunities">
          <div className="panel-title-row">
            <div><span className="panel-kicker">High-priority findings</span><h3>Act before value slips away</h3></div>
            <Link href="/opportunities">Open work queue <ChevronRight size={15}/></Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Vendor</th><th>Module</th><th>Finding</th><th>Confidence</th><th>Status</th><th>Value</th></tr></thead>
              <tbody>
                {data.topFindings.map((row) => (
                  <tr key={row.id}>
                    <td><Link href={`/opportunities/${row.id}`}><strong>{row.vendor}</strong><small className="cell-sub">{row.invoiceNumber ?? row.id.slice(0, 8)}</small></Link></td>
                    <td><span className="module-pill">{titleCase(row.module)}</span></td>
                    <td>{row.title}</td>
                    <td><div className="confidence"><span><i style={{ width: formatPercent(row.confidence) }}/></span>{formatPercent(row.confidence)}</div></td>
                    <td><StatusBadge>{row.recoveryStatusLabel}</StatusBadge></td>
                    <td className="money-good">{formatMoney(row.variance, row.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="command-lower-grid">
        <article className="panel">
          <div className="panel-title-row"><div><span className="panel-kicker">Pending actions</span><h3>Needs your attention</h3></div><span className="count-badge">{metrics.pendingApprovalCount} approvals</span></div>
          <div className="action-list">
            {metrics.pendingApprovalCount > 0 && <Link href="/recoveries"><ShieldAlert size={17}/><div><strong>Decide on {metrics.pendingApprovalCount} claim{metrics.pendingApprovalCount === 1 ? "" : "s"}</strong><small>Approvers: owner, admin, finance</small></div><ChevronRight size={15}/></Link>}
            {Number(metrics.needsReview) > 0 && <Link href="/opportunities?recoverability=needs_review"><ShieldAlert size={17}/><div><strong>Review {formatMoney(metrics.needsReview, currency)} of unverified variance</strong><small>Charges outside the contract or missing activity data</small></div><ChevronRight size={15}/></Link>}
            <Link href="/documents"><UploadCloud size={17}/><div><strong>Upload the next invoice batch</strong><small>CSV/XLSX are audited immediately</small></div><ChevronRight size={15}/></Link>
          </div>
        </article>
        <article className="panel">
          <div className="panel-title-row"><div><span className="panel-kicker">Activity ledger</span><h3>Recent activity</h3></div><span className="sample-label live">Audit log</span></div>
          <div className="activity-list">
            {data.activity.length === 0 && <p className="muted-note">Every upload, audit and approval is written to the audit log.</p>}
            {data.activity.map((entry) => (
              <div className="activity-item" key={entry.id}><span className="activity-icon"><CheckCircle2 size={16}/></span><div><strong>{describeActivity(entry.action, entry.metadata)}</strong><small>{entry.action}</small></div><time>{formatDateTime(entry.created_at)}</time></div>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel-title-row"><div><span className="panel-kicker">Recently processed</span><h3>Documents</h3></div><Link href="/documents">Document center <ArrowRight size={15}/></Link></div>
          <div className="recent-docs">
            {data.recentDocuments.length === 0 && <p className="muted-note">Uploaded files appear here with their processing state.</p>}
            {data.recentDocuments.map((document) => (
              <Link href="/documents" key={document.id}><span><FileText size={16}/></span><div><strong>{document.filename}</strong><small>{titleCase(document.kind)} · {formatDateTime(document.created_at)}</small></div><StatusBadge>{titleCase(document.status)}</StatusBadge></Link>
            ))}
          </div>
        </article>
      </section>

      <section className="intelligence-grid">
        <article className="panel">
          <div className="panel-title-row"><div><span className="panel-kicker">Spend by vendor</span><h3>Monitored coverage</h3></div><Link href="/vendors">All vendors <ArrowRight size={14}/></Link></div>
          <div className="distribution-list">
            {data.spendByVendor.length === 0 && <p className="muted-note">Vendor spend appears after the first invoice.</p>}
            {data.spendByVendor.map((row) => <div key={row.vendor}><span>{row.vendor}</span><i><b style={{ width: `${row.share}%`, background: "#79e2a7" }}/></i><strong>{row.share}%</strong></div>)}
          </div>
        </article>
        <article className="panel">
          <div className="panel-title-row"><div><span className="panel-kicker">Recovery pipeline</span><h3>Value by stage</h3></div><Link href="/recoveries">Open center <ArrowRight size={14}/></Link></div>
          <div className="mini-pipeline">
            {data.pipeline.filter((stage) => stage.count > 0).length === 0 && <p className="muted-note">Cases move from Detected to Recovered through human approval.</p>}
            {data.pipeline.filter((stage) => stage.count > 0).map((stage) => <div key={stage.status}><span>{stage.label} · {stage.count}</span><strong>{formatMoney(stage.amount, currency)}</strong><i><b style={{ width: `${Math.max(4, Math.round((Number(stage.amount) / maxPipeline) * 100))}%` }}/></i></div>)}
          </div>
        </article>
        <article className="panel">
          <div className="panel-title-row"><div><span className="panel-kicker">Controls</span><h3>Guardrails in force</h3></div></div>
          <div className="guardrail-list">
            <div><CheckCircle2 size={15}/><div><strong>Human approval before any claim</strong><small>Owner, admin or finance must approve with evidence confirmation.</small></div></div>
            <div><CheckCircle2 size={15}/><div><strong>Deterministic calculations</strong><small>Fixed-point math with a stored trace on every finding.</small></div></div>
            <div><CheckCircle2 size={15}/><div><strong>Tenant isolation</strong><small>Row-level security on every table and storage object.</small></div></div>
          </div>
        </article>
      </section>
    </>
  );
}
