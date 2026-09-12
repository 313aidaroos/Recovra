"use client";

import { useState } from "react";
import {
  ArrowRight,
  Bot,
  Calculator,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Link2,
  LockKeyhole,
  Send,
  ShieldCheck,
} from "lucide-react";
import type { Opportunity } from "@/lib/platform-data";
import { money } from "@/lib/platform-data";
import { StatusBadge } from "../ui/status-badge";

export function OpportunityDetail({ opportunity }: { opportunity: Opportunity }) {
  const [approved, setApproved] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const variance = opportunity.invoicedAmount - opportunity.expectedAmount;

  return (
    <>
      <section className="detail-hero">
        <div>
          <span className="breadcrumb">Recovery Opportunities <ArrowRight size={12}/> {opportunity.id}</span>
          <div className="detail-title"><span className="vendor-monogram large">{opportunity.vendor.slice(0,2).toUpperCase()}</span><div><h1>{opportunity.issue}</h1><p>{opportunity.vendor} · {opportunity.module} · Detected {opportunity.detectedAt}</p></div></div>
        </div>
        <div className="detail-actions"><StatusBadge>{opportunity.status}</StatusBadge><button className="secondary-button tall">Assign · {opportunity.owner}</button></div>
      </section>

      <section className="detail-metrics">
        <div><span>Potential recovery</span><strong className="money-good">{money(opportunity.potentialRecovery)}</strong><small>Deterministic variance</small></div>
        <div><span>Confidence</span><strong>{opportunity.confidence}%</strong><small>High confidence</small></div>
        <div><span>Evidence</span><strong>{opportunity.evidenceCount} items</strong><small>Sources linked</small></div>
        <div><span>Severity</span><strong>{opportunity.severity}</strong><small>Financial impact</small></div>
      </section>

      <nav className="detail-tabs" aria-label="Opportunity sections">
        {["Overview","Evidence","Invoice lines","Calculation","Activity"].map((tab) => <button className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)} key={tab}>{tab}</button>)}
      </nav>

      <section className="detail-layout">
        <div className="detail-main">
          <article className="panel explanation-panel">
            <div className="panel-title-row"><div><span className="panel-kicker">Finding explanation</span><h3>What Recovra found</h3></div><span className="ai-label"><Bot size={14}/> AI explanation · calculations verified by rule</span></div>
            <p>{opportunity.explanation}</p>
            <div className="calculation-strip">
              <div><small>Invoiced amount</small><strong>{money(opportunity.invoicedAmount)}</strong></div><span>−</span>
              <div><small>Expected amount</small><strong>{money(opportunity.expectedAmount)}</strong></div><span>=</span>
              <div className="variance"><small>Variance detected</small><strong>{money(variance)}</strong></div>
            </div>
            <div className="rule-trace"><Calculator size={17}/><div><strong>Rule: logistics.residential-surcharge.v3</strong><small>3,210 eligible shipments × ($11.68 billed − $4.15 contracted) = $24,171.30, plus $9.00 in duplicate line variance.</small></div><StatusBadge>Verified</StatusBadge></div>
          </article>

          <article className="panel">
            <div className="panel-title-row"><div><span className="panel-kicker">Evidence package</span><h3>Sources supporting this finding</h3></div><span className="evidence-count">{opportunity.evidenceCount} linked records</span></div>
            <div className="evidence-grid">
              <div><span><FileText size={18}/></span><div><small>Source invoice</small><strong>{opportunity.invoice}</strong><p>Pages 4–18 · 3,210 affected lines</p></div><button aria-label="Open invoice"><ArrowRight size={15}/></button></div>
              <div><span><FileCheck2 size={18}/></span><div><small>Contract / rate source</small><strong>{opportunity.contract}</strong><p>{opportunity.clause}</p></div><button aria-label="Open contract"><ArrowRight size={15}/></button></div>
              <div><span><Link2 size={18}/></span><div><small>Operational activity</small><strong>August parcel manifest</strong><p>8,440 shipments · matched 100%</p></div><button aria-label="Open activity"><ArrowRight size={15}/></button></div>
            </div>
            <blockquote className="clause-quote"><span>Relevant contract clause</span>“Residential delivery surcharge shall not exceed $4.15 per shipment for qualifying service levels during the agreement term.”<cite>{opportunity.contract} · {opportunity.clause}</cite></blockquote>
          </article>

          <article className="panel">
            <div className="panel-title-row"><div><span className="panel-kicker">Affected charges</span><h3>Invoice line sample</h3></div><button className="text-button">View all 3,210 lines <ArrowRight size={14}/></button></div>
            <div className="table-wrap"><table><thead><tr><th>Tracking ID</th><th>Service</th><th>Billed</th><th>Expected</th><th>Variance</th><th>Evidence</th></tr></thead><tbody>
              {[["NSP…1842","Ground residential","$11.68","$4.15","$7.53","Matched"],["NSP…9018","Ground residential","$11.68","$4.15","$7.53","Matched"],["NSP…4201","Home delivery","$11.68","$4.15","$7.53","Matched"]].map((row)=><tr key={row[0]}>{row.map((cell,index)=><td className={index===4?"money-good":undefined} key={cell}>{index===5?<StatusBadge tone="good">{cell}</StatusBadge>:cell}</td>)}</tr>)}
            </tbody></table></div>
          </article>
        </div>

        <aside className="detail-side">
          <article className="panel action-card">
            <span className="panel-kicker">Recommended next action</span><h3>Approve claim package</h3><p>{opportunity.recommendedAction}</p>
            <label className="approval-check"><input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)}/><span>{approved && <Check size={13}/>}</span><div><strong>I reviewed the evidence</strong><small>Required before a claim can be prepared for submission.</small></div></label>
            <button className="primary-button wide" disabled={!approved}><Send size={15}/> Prepare approved claim</button>
            <div className="human-control"><LockKeyhole size={14}/> Recovra will never submit without human approval.</div>
          </article>
          <article className="panel claim-draft">
            <div className="panel-title-row"><div><span className="panel-kicker">Claim draft</span><h3>Vendor review request</h3></div><StatusBadge tone="neutral">Draft</StatusBadge></div>
            <p><strong>Subject:</strong> Review request for invoice {opportunity.invoice}</p>
            <p>We identified a {money(opportunity.potentialRecovery)} discrepancy between billed residential surcharges and the active agreement. The attached package includes the relevant clause, affected lines, and calculation trace.</p>
            <button className="secondary-button tall"><FileText size={15}/> Open editor</button>
          </article>
          <article className="panel timeline">
            <span className="panel-kicker">Activity timeline</span>
            <div><i className="complete"><CheckCircle2 size={13}/></i><p><strong>Finding verified</strong><small>Rule engine · Sep 10, 10:14</small></p></div>
            <div><i className="complete"><ShieldCheck size={13}/></i><p><strong>Evidence package assembled</strong><small>Evidence Agent · Sep 10, 10:16</small></p></div>
            <div><i><Clock3 size={13}/></i><p><strong>Awaiting approval</strong><small>Assigned to {opportunity.owner}</small></p></div>
          </article>
        </aside>
      </section>
    </>
  );
}
