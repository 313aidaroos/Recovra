import Link from "next/link";
import { UploadCloud } from "lucide-react";
import type { VendorListItem } from "@/lib/db/resources";
import { formatMoney, titleCase } from "@/lib/format";
import { isZero } from "@/lib/recovery-engine";
import { PageHeader } from "../ui/page-header";
import { EmptyState } from "./empty-state";

export function VendorsTable({ rows, currency }: { rows: VendorListItem[]; currency: string }) {
  return (
    <>
      <PageHeader eyebrow="Vendor intelligence" title="Vendors" description="Spend monitored, variance found and value recovered by vendor. Vendors are created automatically from invoices and rate sheets." actions={<Link className="primary-button" href="/documents"><UploadCloud size={15}/> Upload documents</Link>}/>
      {rows.length === 0 ? (
        <EmptyState title="No vendors yet" description="Vendors appear as soon as you upload a rate sheet or an invoice that names them."/>
      ) : (
        <section className="panel resource-panel">
          <div className="active-filters"><span>Live tenant data</span><small>{rows.length} vendor{rows.length === 1 ? "" : "s"}</small></div>
          <div className="table-wrap"><table><thead><tr><th>Vendor</th><th>Category</th><th>Spend monitored</th><th>Open variance</th><th>Recovered</th><th>Contracts</th><th>Invoices</th><th>Top issue</th></tr></thead><tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td><Link href={`/invoices?vendor=${row.id}`}><strong>{row.name}</strong></Link></td>
                <td>{row.category ? titleCase(row.category) : <span className="muted">—</span>}</td>
                <td>{formatMoney(row.spend, currency)}</td>
                <td className={isZero(row.openVariance) ? undefined : "money-good"}>{formatMoney(row.openVariance, currency, { cents: true })}</td>
                <td>{formatMoney(row.recovered, currency, { cents: true })}</td>
                <td>{row.contractCount}</td>
                <td>{row.invoiceCount}</td>
                <td>{row.topCategory ? titleCase(row.topCategory) : <span className="muted">None</span>}</td>
              </tr>
            ))}
          </tbody></table></div>
        </section>
      )}
    </>
  );
}
