import Link from "next/link";
import { UploadCloud } from "lucide-react";
import type { InvoiceListItem } from "@/lib/db/resources";
import { formatDate, formatMoney, titleCase } from "@/lib/format";
import { isZero } from "@/lib/recovery-engine";
import { PageHeader } from "../ui/page-header";
import { StatusBadge } from "../ui/status-badge";
import { EmptyState } from "./empty-state";

const statusTone = (status: string) => status === "findings" ? "warn" : status === "clean" ? "good" : "neutral";

export function InvoicesTable({ rows }: { rows: InvoiceListItem[] }) {
  return (
    <>
      <PageHeader eyebrow="Billing intelligence" title="Invoices" description="Every ingested invoice, its audit state and the variance found against your contracted terms." actions={<Link className="primary-button" href="/documents"><UploadCloud size={15}/> Upload invoice</Link>}/>
      {rows.length === 0 ? (
        <EmptyState title="No invoices ingested yet" description="Upload an invoice CSV or XLSX in the Document Center. Recovra normalizes each line and audits it immediately."/>
      ) : (
        <section className="panel resource-panel">
          <div className="active-filters"><span>Live tenant data</span><span>Newest first</span><small>{rows.length} invoice{rows.length === 1 ? "" : "s"}</small></div>
          <div className="table-wrap"><table><thead><tr><th>Invoice</th><th>Vendor</th><th>Amount</th><th>Date</th><th>Audit state</th><th>Variance</th><th>Findings</th><th>Source file</th></tr></thead><tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td><Link href={`/invoices/${row.id}`}><strong>{row.invoice_number ?? row.id.slice(0, 8)}</strong></Link></td>
                <td>{row.vendorName}</td>
                <td>{formatMoney(row.total, row.currency, { cents: true })}</td>
                <td>{formatDate(row.invoice_date)}</td>
                <td><StatusBadge tone={statusTone(row.status)}>{titleCase(row.status)}</StatusBadge></td>
                <td className={isZero(row.variance) ? undefined : "money-good"}>{formatMoney(row.variance, row.currency, { cents: true })}</td>
                <td>{row.findingCount}</td>
                <td><span className="muted">{row.documentName ?? "—"}</span></td>
              </tr>
            ))}
          </tbody></table></div>
        </section>
      )}
    </>
  );
}
