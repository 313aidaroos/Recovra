"use client";

import Link from "next/link";
import { CheckCircle2, FileCheck2, Search, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { money, opportunities } from "@/lib/platform-data";
import { PageHeader } from "./ui/page-header";
import { StatusBadge } from "./ui/status-badge";

const stages = [
  ["Finding", 746_210, 26],
  ["Verify", 618_900, 18],
  ["Evidence Package", 574_892, 14],
  ["Approval", 518_420, 9],
  ["Submitted", 501_240, 7],
  ["Vendor Decision", 493_100, 6],
  ["Recovery", 481_904, 5],
] as const;

export function RecoveriesTable() {
  const [query, setQuery] = useState("");
  const rows = opportunities.filter((item) => `${item.vendor} ${item.issue} ${item.status}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <PageHeader eyebrow="Recovery center" title="From finding to money recovered." description="Verify findings, assemble evidence, collect approval, and track every vendor decision to the savings ledger." actions={<button className="primary-button"><FileCheck2 size={15}/> Create evidence package</button>}/>
      <section className="pipeline-board">
        {stages.map(([label,value,count],index)=><div key={label}><span>{index+1}</span><small>{label}</small><strong>{money(value)}</strong><em>{count} cases</em>{index<stages.length-1&&<i/>}</div>)}
      </section>
      <section className="recovery-summary">
        <article className="panel"><ShieldCheck size={18}/><div><span>Verified opportunity</span><strong>$574,892</strong></div><small>77% of detected</small></article>
        <article className="panel"><Send size={18}/><div><span>Submitted</span><strong>$501,240</strong></div><small>87% of verified</small></article>
        <article className="panel"><CheckCircle2 size={18}/><div><span>Realized recovery</span><strong>$481,904</strong></div><small>Sample workspace</small></article>
      </section>
      <section className="panel resource-panel">
        <div className="advanced-toolbar"><label className="search-input"><Search size={16}/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search recovery cases…"/></label><div className="filter-row"><select><option>All stages</option><option>Approval</option><option>Submitted</option><option>Recovered</option></select></div></div>
        <div className="table-wrap"><table><thead><tr><th>Case / Vendor</th><th>Issue</th><th>Module</th><th>Owner</th><th>Evidence</th><th>Status</th><th>Value</th></tr></thead><tbody>
          {rows.map((item)=><tr key={item.id}><td><Link href={`/opportunities/${item.id}`}><strong>{item.id}</strong><small className="cell-sub">{item.vendor}</small></Link></td><td>{item.issue}</td><td><span className="module-pill">{item.module}</span></td><td>{item.owner}</td><td>{item.evidenceCount} items</td><td><StatusBadge>{item.status}</StatusBadge></td><td className="money-good">{money(item.potentialRecovery)}</td></tr>)}
        </tbody></table></div>
      </section>
    </>
  );
}
