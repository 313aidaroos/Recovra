import Link from "next/link";
import { UploadCloud } from "lucide-react";
import type { ContractListItem } from "@/lib/db/resources";
import { formatDate, formatDateTime, titleCase } from "@/lib/format";
import { PageHeader } from "../ui/page-header";
import { StatusBadge } from "../ui/status-badge";
import { EmptyState } from "./empty-state";

export function ContractsTable({ rows }: { rows: ContractListItem[] }) {
  const active = rows.filter((row) => row.status === "active");
  return (
    <>
      <PageHeader eyebrow="Agreement intelligence" title="Contracts & rate sheets" description="The contracted rates, fuel percentages, free-time allowances and approved accessorials that every invoice is audited against." actions={<Link className="primary-button" href="/documents"><UploadCloud size={15}/> Upload rate sheet</Link>}/>
      {rows.length === 0 ? (
        <EmptyState title="No contracts or rate sheets yet" description="Upload a vendor rate sheet (CSV/XLSX). Each row becomes a contract term with a source locator, and every later invoice is audited against it."/>
      ) : (
        <section className="panel resource-panel">
          <div className="active-filters"><span>Live tenant data</span><span>{active.length} active</span><small>{rows.length} agreement{rows.length === 1 ? "" : "s"} incl. superseded versions</small></div>
          <div className="table-wrap"><table><thead><tr><th>Agreement</th><th>Vendor</th><th>Effective</th><th>Expires</th><th>Status</th><th>Terms</th><th>Source</th><th>Loaded</th></tr></thead><tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td><Link href={`/contracts/${row.id}`}><strong>{row.title}</strong></Link></td>
                <td>{row.vendorName}</td>
                <td>{formatDate(row.effective_from)}</td>
                <td>{formatDate(row.effective_to)}</td>
                <td><StatusBadge tone={row.status === "active" ? "good" : "neutral"}>{titleCase(row.status)}</StatusBadge></td>
                <td>{row.termCount}</td>
                <td><span className="muted">{row.documentName ?? "—"}</span></td>
                <td>{formatDateTime(row.created_at)}</td>
              </tr>
            ))}
          </tbody></table></div>
        </section>
      )}
    </>
  );
}
