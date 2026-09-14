"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { FindingListItem } from "@/lib/db/findings";
import { formatDate, formatMoney, formatPercent, titleCase } from "@/lib/format";
import { StatusBadge } from "../ui/status-badge";

const severityTone = (severity: string) => severity === "critical" || severity === "high" ? "risk" : severity === "medium" ? "warn" : "neutral";

export function FindingsTable({ rows, initialRecoverability = "all" }: { rows: FindingListItem[]; initialRecoverability?: string }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [recoverability, setRecoverability] = useState(initialRecoverability);
  const [vendor, setVendor] = useState("all");
  const [severity, setSeverity] = useState("all");

  const vendors = useMemo(() => [...new Set(rows.map((row) => row.vendor))].sort(), [rows]);
  const statuses = useMemo(() => [...new Set(rows.map((row) => row.recoveryStatusLabel))].sort(), [rows]);

  const filtered = useMemo(() => rows.filter((row) => {
    const haystack = `${row.vendor} ${row.title} ${row.category} ${row.module} ${row.invoiceNumber ?? ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase())
      && (status === "all" || row.recoveryStatusLabel === status)
      && (recoverability === "all" || row.recoverability === recoverability)
      && (vendor === "all" || row.vendor === vendor)
      && (severity === "all" || row.severity === severity);
  }), [rows, query, status, recoverability, vendor, severity]);

  return (
    <section className="panel resource-panel">
      <div className="advanced-toolbar">
        <label className="search-input"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search vendor, finding, invoice…"/></label>
        <div className="filter-row">
          <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            {statuses.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select aria-label="Filter by recoverability" value={recoverability} onChange={(event) => setRecoverability(event.target.value)}>
            <option value="all">Verified + review</option>
            <option value="recoverable">Verified quality</option>
            <option value="needs_review">Needs review</option>
          </select>
          <select aria-label="Filter by vendor" value={vendor} onChange={(event) => setVendor(event.target.value)}>
            <option value="all">All vendors</option>
            {vendors.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select aria-label="Filter by severity" value={severity} onChange={(event) => setSeverity(event.target.value)}>
            <option value="all">All severities</option>
            <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
        </div>
      </div>
      <div className="active-filters"><span>Live tenant data</span><span>Sorted by value</span><small>{filtered.length} of {rows.length} findings</small></div>
      <div className="table-wrap">
        <table className="opportunities-table">
          <thead><tr><th>Finding / Vendor</th><th>Module</th><th>Issue type</th><th>Billed</th><th>Expected</th><th>Potential</th><th>Confidence</th><th>Severity</th><th>Status</th><th>Detected</th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={10} className="table-empty">No findings match these filters.</td></tr>}
            {filtered.map((row) => (
              <tr key={row.id}>
                <td><Link href={`/opportunities/${row.id}`}><strong>{row.vendor}</strong><small className="cell-sub">{row.title}</small></Link></td>
                <td><span className="module-pill">{titleCase(row.module)}</span></td>
                <td><Link href={`/opportunities/${row.id}`}>{titleCase(row.category)}<small className="cell-sub">{row.invoiceNumber ? `Invoice ${row.invoiceNumber}` : "Invoice-level"} · {row.evidenceCount} evidence</small></Link></td>
                <td>{formatMoney(row.billedAmount, row.currency, { cents: true })}</td>
                <td>{row.expectedAmount === null ? <span className="muted">Needs review</span> : formatMoney(row.expectedAmount, row.currency, { cents: true })}</td>
                <td className="money-good">{formatMoney(row.variance, row.currency, { cents: true })}</td>
                <td><div className="confidence"><span><i style={{ width: formatPercent(row.confidence) }}/></span>{formatPercent(row.confidence)}</div></td>
                <td><StatusBadge tone={severityTone(row.severity)}>{titleCase(row.severity)}</StatusBadge></td>
                <td><StatusBadge>{row.recoveryStatusLabel}</StatusBadge></td>
                <td>{formatDate(row.detectedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
