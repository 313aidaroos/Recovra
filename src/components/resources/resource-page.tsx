"use client";

import { Download, Filter, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "../ui/data-table";
import { PageHeader } from "../ui/page-header";

type ResourcePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
  columns: string[];
  rows: string[][];
  statusColumns?: number[];
  moneyColumns?: number[];
  children?: React.ReactNode;
};

export function ResourcePage({
  eyebrow,
  title,
  description,
  actionLabel,
  columns,
  rows,
  statusColumns,
  moneyColumns,
  children,
}: ResourcePageProps) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => rows.filter((row) => row.join(" ").toLowerCase().includes(query.toLowerCase())), [query, rows]);

  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} actions={<><button className="secondary-button tall"><Download size={15}/> Export</button><button className="primary-button"><Plus size={15}/> {actionLabel}</button></>}/>
      {children}
      <section className="panel resource-panel">
        <div className="advanced-toolbar">
          <label className="search-input"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${title.toLowerCase()}…`}/></label>
          <div className="filter-row"><button><Filter size={15}/> Filters</button><select aria-label="Select date range"><option>Last 90 days</option><option>This year</option><option>All time</option></select></div>
        </div>
        <DataTable columns={columns} rows={filtered} statusColumns={statusColumns} moneyColumns={moneyColumns}/>
      </section>
    </>
  );
}
