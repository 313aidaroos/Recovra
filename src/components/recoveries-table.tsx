"use client";
import { useState } from "react";
import { Filter, Search } from "lucide-react";
import { opportunities } from "@/lib/demo-data";

const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
export function RecoveriesTable(){
 const [q,setQ]=useState(""); const rows=opportunities.filter(r=>(r.vendor+r.issue+r.module+r.status).toLowerCase().includes(q.toLowerCase()));
 return <>
  <section className="page-heading"><div><span className="eyebrow">Recovery operations</span><h1>Turn findings into realized value.</h1><p>Review, approve, submit and track every recovery without confusing estimated opportunity with cash received.</p></div></section>
  <section className="panel"><div className="table-toolbar"><label><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search cases…"/></label><button className="secondary-button"><Filter size={16}/> Filter</button></div><div className="table-wrap"><table><thead><tr><th>Case</th><th>Module</th><th>Issue</th><th>Status</th><th>Confidence</th><th>Claim value</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i}><td><strong>RCV-{2481+i}</strong><small className="cell-sub">{r.vendor}</small></td><td>{r.module}</td><td>{r.issue}</td><td><span className="status-pill">{r.status}</span></td><td>{r.confidence}%</td><td className="money-good">{money(r.amount)}</td></tr>)}</tbody></table></div></section>
 </>;
}
