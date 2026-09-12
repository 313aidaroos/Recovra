"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  FileText,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UploadCloud,
} from "lucide-react";
import { activity, dashboardMetrics, money, opportunities } from "@/lib/platform-data";
import { MetricCard } from "./metric-card";
import { StatusBadge } from "./ui/status-badge";

export function RecoveryDashboard() {
  const [range, setRange] = useState("30D");
  const scale = range === "7D" ? 0.28 : range === "90D" ? 1.7 : range === "YTD" ? 3.2 : 1;

  return (
    <>
      <section className="page-heading">
        <div>
          <span className="eyebrow"><Sparkles size={14}/> Recovery Intelligence</span>
          <h1>Command Center</h1>
          <p>Monitor leakage, validate recoveries, and stop recurring spend across every active module.</p>
        </div>
        <div className="heading-controls">
          <div className="range-tabs">
            {["7D", "30D", "90D", "YTD"].map((item) => (
              <button className={range === item ? "selected" : ""} onClick={() => setRange(item)} key={item}>{item}</button>
            ))}
          </div>
          <Link className="primary-button" href="/documents"><UploadCloud size={15}/> Upload documents</Link>
        </div>
      </section>

      <section className="metrics-grid">
        <MetricCard label="Total spend monitored" value={dashboardMetrics.monitored * scale} delta={12} note="Across 8 active modules"/>
        <MetricCard label="Recovery opportunities" value={dashboardMetrics.found * scale} delta={18} tone="warn" note="Estimated + verified"/>
        <MetricCard label="Recovered" value={dashboardMetrics.recovered * scale} delta={23} tone="good" note="Approved & realized only"/>
        <MetricCard label="Prevented" value={dashboardMetrics.prevented * scale} delta={31} tone="good" note="Future spend stopped"/>
      </section>

      <section className="command-grid">
        <article className="panel trend-panel">
          <div className="panel-title-row">
            <div><span className="panel-kicker">Recovery trend</span><h3>Value protected over time</h3></div>
            <span className="chip good"><TrendingUp size={14}/> +27.4%</span>
          </div>
          <div className="chart-legend"><span><i className="dot recovered"/>Identified</span><span><i className="dot prevented"/>Recovered</span><span><i className="dot pending"/>Prevented</span></div>
          <div className="area-chart" aria-label="Sample monthly recovery trend">
            <div className="chart-gridlines"><i/><i/><i/><i/></div>
            <svg viewBox="0 0 720 230" preserveAspectRatio="none" role="img">
              <title>Sample recovery value increases throughout the year</title>
              <defs>
                <linearGradient id="recovery-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#79e2a7" stopOpacity=".55"/><stop offset="100%" stopColor="#79e2a7" stopOpacity=".03"/></linearGradient>
              </defs>
              <path className="area-fill" d="M0 194 L65 166 L130 176 L196 138 L261 148 L327 112 L392 120 L458 82 L523 94 L589 61 L654 72 L720 31 L720 230 L0 230 Z"/>
              <polyline points="0,194 65,166 130,176 196,138 261,148 327,112 392,120 458,82 523,94 589,61 654,72 720,31"/>
              <polyline className="secondary-line" points="0,214 65,205 130,202 196,184 261,178 327,161 392,151 458,139 523,120 589,108 654,94 720,76"/>
            </svg>
            <div className="chart-months">{["Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep"].map((month) => <span key={month}>{month}</span>)}</div>
          </div>
        </article>

        <article className="panel top-opportunities">
          <div className="panel-title-row">
            <div><span className="panel-kicker">Priority queue</span><h3>Top recovery opportunities</h3></div>
            <Link href="/opportunities">View all <ArrowRight size={15}/></Link>
          </div>
          <div className="opportunity-stack">
            {opportunities.slice(0, 5).map((row) => (
              <Link href={`/opportunities/${row.id}`} key={row.id}>
                <span className="vendor-monogram">{row.vendor.slice(0, 2).toUpperCase()}</span>
                <div><strong>{row.vendor}</strong><small>{row.issue}</small></div>
                <div className="stack-value"><strong>{money(row.potentialRecovery)}</strong><small>{row.confidence}% confidence</small></div>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="panel opportunities-panel command-opportunities">
        <div className="panel-title-row">
          <div><span className="panel-kicker">High-priority findings</span><h3>Act before value slips away</h3></div>
          <Link href="/opportunities">Open work queue <ChevronRight size={15}/></Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Vendor</th><th>Module</th><th>Finding</th><th>Confidence</th><th>Status</th><th>Value</th></tr></thead>
            <tbody>
              {opportunities.slice(0, 5).map((row) => (
                <tr key={row.id}>
                  <td><Link href={`/opportunities/${row.id}`}><strong>{row.vendor}</strong><small className="cell-sub">{row.id}</small></Link></td>
                  <td><span className="module-pill">{row.module}</span></td>
                  <td>{row.issue}</td>
                  <td><div className="confidence"><span><i style={{width: `${row.confidence}%`}}/></span>{row.confidence}%</div></td>
                  <td><StatusBadge>{row.status}</StatusBadge></td>
                  <td className="money-good">{money(row.potentialRecovery)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="command-lower-grid">
        <article className="panel">
          <div className="panel-title-row"><div><span className="panel-kicker">Pending actions</span><h3>Needs your attention</h3></div><span className="count-badge">7 open</span></div>
          <div className="action-list">
            <Link href="/opportunities/RCV-2481"><ShieldAlert size={17}/><div><strong>Approve parcel evidence package</strong><small>NorthStar Parcel · $24,180 potential recovery</small></div><ChevronRight size={15}/></Link>
            <Link href="/contracts"><AlertTriangle size={17}/><div><strong>Review upcoming SaaS renewal</strong><small>DataDesk · renews in 18 days</small></div><ChevronRight size={15}/></Link>
            <Link href="/documents"><FileCheck2 size={17}/><div><strong>Confirm extracted contract clause</strong><small>Nimbus Cloud · Schedule B</small></div><ChevronRight size={15}/></Link>
          </div>
        </article>
        <article className="panel">
          <div className="panel-title-row"><div><span className="panel-kicker">Activity ledger</span><h3>Recent activity</h3></div><span className="sample-label">Sample data</span></div>
          <div className="activity-list">{activity.map(([value, source, time]) => <div className="activity-item" key={value}><span className="activity-icon"><CheckCircle2 size={16}/></span><div><strong>{value}</strong><small>{source}</small></div><time>{time}</time></div>)}</div>
        </article>
        <article className="panel">
          <div className="panel-title-row"><div><span className="panel-kicker">Recently processed</span><h3>Documents</h3></div><Link href="/documents">Document center <ArrowRight size={15}/></Link></div>
          <div className="recent-docs">
            {[
              ["NSP_Invoice_884103.pdf","Invoice · 18 pages","Complete"],
              ["Parcel_Rate_Card_2026.xlsx","Rate sheet · 1,204 rows","Complete"],
              ["Cloud_Commitment_Order.pdf","Contract · 12 pages","Needs Review"],
            ].map(([name, meta, status]) => <Link href="/documents" key={name}><span><FileText size={16}/></span><div><strong>{name}</strong><small>{meta}</small></div><StatusBadge>{status}</StatusBadge></Link>)}
          </div>
        </article>
      </section>

      <section className="intelligence-grid">
        <article className="panel">
          <div className="panel-title-row"><div><span className="panel-kicker">Spend by industry</span><h3>Monitored coverage</h3></div><Link href="/reports">Analyze <ArrowRight size={14}/></Link></div>
          <div className="distribution-list">
            {[["Logistics","32%","#79e2a7"],["Technology","25%","#65a9dc"],["Manufacturing","18%","#f2c66d"],["Telecom","14%","#aa8ee8"],["Other","11%","#71867b"]].map(([label,value,color])=><div key={label}><span>{label}</span><i><b style={{width:value,background:color}}/></i><strong>{value}</strong></div>)}
          </div>
        </article>
        <article className="panel">
          <div className="panel-title-row"><div><span className="panel-kicker">Recovery pipeline</span><h3>Value by stage</h3></div><Link href="/recoveries">Open center <ArrowRight size={14}/></Link></div>
          <div className="mini-pipeline">
            {[["Detected","$746K","100%"],["Verified","$575K","77%"],["Submitted","$501K","67%"],["Recovered","$482K","65%"]].map(([label,value,width])=><div key={label}><span>{label}</span><strong>{value}</strong><i><b style={{width}}/></i></div>)}
          </div>
        </article>
        <article className="panel">
          <div className="panel-title-row"><div><span className="panel-kicker">Vendor anomaly watch</span><h3>Highest risk signals</h3></div><Link href="/vendors">All vendors <ArrowRight size={14}/></Link></div>
          <div className="risk-list">
            {[["Veridian Wireless","81","Inactive lines recurring"],["NorthStar Parcel","78","Surcharge variance"],["Rapid 3PL","71","Inventory mismatch"]].map(([vendor,score,signal])=><Link href="/vendors" key={vendor}><span className="risk-score">{score}</span><div><strong>{vendor}</strong><small>{signal}</small></div><StatusBadge tone={Number(score)>79?"risk":"warn"}>{Number(score)>79?"High":"Elevated"}</StatusBadge></Link>)}
          </div>
        </article>
      </section>
    </>
  );
}
