"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronRight, CircleDollarSign, FileSearch2, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { headline, opportunities, activity, trend } from "@/lib/demo-data";
import { modules } from "@/lib/modules";
import { MetricCard } from "./metric-card";

const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);

export function RecoveryDashboard(){
  const [range,setRange]=useState("30D");
  const scale = range==="7D"?.28:range==="90D"?1.7:range==="YTD"?3.2:1;
  const topModules=useMemo(()=>[...modules].filter(m=>m.found>0).sort((a,b)=>b.found-a.found).slice(0,6),[]);
  return <>
    <section className="page-heading">
      <div><span className="eyebrow"><Sparkles size={14}/> Recovery Intelligence</span><h1>Your money, reconciled.</h1><p>One view of leakage found, money recovered, and waste stopped before payment.</p></div>
      <div className="range-tabs">{["7D","30D","90D","YTD"].map(x=><button className={range===x?"selected":""} onClick={()=>setRange(x)} key={x}>{x}</button>)}</div>
    </section>

    <section className="metrics-grid">
      <MetricCard label="Spend monitored" value={headline.monitored*scale} delta={12} note="Across 18 recovery modules"/>
      <MetricCard label="Opportunity found" value={headline.found*scale} delta={18} tone="warn" note="Estimated + verified"/>
      <MetricCard label="Recovered" value={headline.recovered*scale} delta={24} tone="good" note="Approved & realized value"/>
      <MetricCard label="Prevented" value={headline.prevented*scale} delta={31} tone="good" note="Future spend stopped"/>
    </section>

    <section className="dashboard-grid">
      <article className="panel recovery-pulse">
        <div className="panel-head"><div><span className="panel-kicker">Recovery pulse</span><h2>{money((headline.recovered+headline.prevented)*scale)}</h2><p>Total value protected</p></div><span className="chip good"><TrendingUp size={14}/> +27.4%</span></div>
        <div className="spark-bars" aria-label="Demo recovery trend">{trend.map((n,i)=><span key={i} style={{height:`${Math.max(16,n/1.25)}%`}} title={`period ${i+1}`}/>)}</div>
        <div className="pulse-legend"><span><i className="dot recovered"/>Recovered</span><span><i className="dot pending"/>Verified pending</span><span><i className="dot prevented"/>Prevented</span></div>
      </article>

      <article className="panel recovery-funnel">
        <div className="panel-title-row"><div><span className="panel-kicker">Recovery pipeline</span><h3>From signal to cash</h3></div><Link href="/recoveries">Open pipeline <ArrowRight size={15}/></Link></div>
        <div className="funnel-row"><span><FileSearch2 size={17}/> Found</span><strong>{money(headline.found*scale)}</strong></div>
        <div className="funnel-line"><i style={{width:"82%"}}/></div>
        <div className="funnel-row"><span><ShieldCheck size={17}/> Verified</span><strong>{money(headline.verified*scale)}</strong></div>
        <div className="funnel-line"><i style={{width:"65%"}}/></div>
        <div className="funnel-row"><span><CircleDollarSign size={17}/> Recovered</span><strong>{money(headline.recovered*scale)}</strong></div>
        <div className="funnel-line"><i style={{width:"54%"}}/></div>
        <p className="funnel-note"><CheckCircle2 size={15}/> 64.6% of identified value has been realized.</p>
      </article>
    </section>

    <section className="panel opportunities-panel">
      <div className="panel-title-row"><div><span className="panel-kicker">Priority queue</span><h3>Highest-value opportunities</h3></div><button className="text-button">View all <ChevronRight size={15}/></button></div>
      <div className="table-wrap"><table><thead><tr><th>Vendor</th><th>Module</th><th>Finding</th><th>Confidence</th><th>Status</th><th>Value</th></tr></thead><tbody>
        {opportunities.map(row=><tr key={row.vendor+row.issue}><td><strong>{row.vendor}</strong></td><td><span className="module-pill">{row.module}</span></td><td>{row.issue}</td><td><div className="confidence"><span><i style={{width:`${row.confidence}%`}}/></span>{row.confidence}%</div></td><td><span className="status-pill">{row.status}</span></td><td className="money-good">{money(row.amount)}</td></tr>)}
      </tbody></table></div>
    </section>

    <section className="dashboard-grid lower">
      <article className="panel">
        <div className="panel-title-row"><div><span className="panel-kicker">Coverage</span><h3>Recovery modules</h3></div><Link href="/modules">All modules <ArrowRight size={15}/></Link></div>
        <div className="module-mini-grid">{topModules.map(({slug,name,icon:Icon,found,status})=><Link href="/modules" key={slug} className="module-mini"><span className="mini-icon"><Icon size={17}/></span><div><strong>{name}</strong><small>{money(found)} found</small></div><span className={`tiny-status ${status}`}>{status}</span></Link>)}</div>
      </article>
      <article className="panel">
        <div className="panel-title-row"><div><span className="panel-kicker">Live ledger</span><h3>Recent activity</h3></div><span className="live-badge"><i/> Streaming</span></div>
        <div className="activity-list">{activity.map(([value,action,source,time])=><div className="activity-item" key={value+action}><span className="activity-icon"><CheckCircle2 size={16}/></span><div><strong>{value} {action}</strong><small>{source}</small></div><time>{time}</time></div>)}</div>
      </article>
    </section>
  </>;
}
