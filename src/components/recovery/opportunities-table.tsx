"use client";

import Link from "next/link";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { money, opportunities } from "@/lib/platform-data";
import { StatusBadge } from "../ui/status-badge";

export function OpportunitiesTable() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const rows = useMemo(() => opportunities.filter((item) => {
    const matchesQuery = `${item.vendor} ${item.module} ${item.issue} ${item.id}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (status === "All statuses" || item.status === status);
  }), [query, status]);

  return (
    <section className="panel resource-panel">
      <div className="advanced-toolbar">
        <label className="search-input"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search vendor, issue or case…"/></label>
        <div className="filter-row">
          <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option>All statuses</option><option>Detected</option><option>Reviewing</option><option>Verified</option><option>Claim Ready</option><option>Submitted</option><option>Approved</option><option>Recovered</option>
          </select>
          <button><SlidersHorizontal size={15}/> More filters</button>
          <button><Filter size={15}/> Saved view</button>
        </div>
      </div>
      <div className="active-filters"><span>Industry: All</span><span>Confidence: 80%+</span><span>Severity: Medium+</span><small>{rows.length} opportunities</small></div>
      <div className="table-wrap">
        <table className="opportunities-table">
          <thead><tr><th>Case / Vendor</th><th>Module</th><th>Issue type</th><th>Invoiced</th><th>Expected</th><th>Potential</th><th>Confidence</th><th>Severity</th><th>Status</th></tr></thead>
          <tbody>{rows.map((item) => (
            <tr key={item.id}>
              <td><Link href={`/opportunities/${item.id}`}><strong>{item.vendor}</strong><small className="cell-sub">{item.id} · {item.detectedAt}</small></Link></td>
              <td><span className="module-pill">{item.module}</span></td>
              <td><Link href={`/opportunities/${item.id}`}>{item.issue}<small className="cell-sub">{item.evidenceCount} evidence items</small></Link></td>
              <td>{money(item.invoicedAmount)}</td><td>{money(item.expectedAmount)}</td><td className="money-good">{money(item.potentialRecovery)}</td>
              <td><div className="confidence"><span><i style={{width: `${item.confidence}%`}}/></span>{item.confidence}%</div></td>
              <td><StatusBadge tone={item.severity === "Critical" || item.severity === "High" ? "risk" : "warn"}>{item.severity}</StatusBadge></td>
              <td><StatusBadge>{item.status}</StatusBadge></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}
