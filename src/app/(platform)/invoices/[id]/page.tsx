import { ArrowRight, FileCheck2, FileText, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { InvoiceDetail } from "@/components/live/invoice-detail";
import { StatusBadge } from "@/components/ui/status-badge";
import { getWorkspace } from "@/lib/auth/workspace";
import { createSignedDocumentUrl, loadInvoiceDetail } from "@/lib/db/resources";
import { invoices } from "@/lib/platform-data";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspace = await getWorkspace();

  if (workspace.mode === "live" && UUID.test(id)) {
    const data = await loadInvoiceDetail(workspace, id);
    if (!data) notFound();
    const documentUrl = data.document ? await createSignedDocumentUrl(workspace, data.document) : null;
    return <InvoiceDetail data={data} role={workspace.role} documentUrl={documentUrl}/>;
  }

  const invoice = invoices.find((row) => row[0] === id);
  if (!invoice) notFound();
  const [number,vendor,amount,date,status,discrepancy,contract,findings] = invoice;
  return (
    <>
      <section className="detail-hero"><div><span className="breadcrumb">Invoices <ArrowRight size={12}/> {number}</span><div className="detail-title"><span className="vendor-monogram large">{vendor.slice(0,2).toUpperCase()}</span><div><h1>{number}</h1><p>{vendor} · {date} · Linked to {contract}</p></div></div></div><div className="detail-actions"><StatusBadge>{status}</StatusBadge><button className="primary-button"><FileText size={15}/> Export audit</button></div></section>
      <section className="detail-metrics"><div><span>Invoice amount</span><strong>{amount}</strong><small>Source total</small></div><div><span>Discrepancy</span><strong className="money-good">{discrepancy}</strong><small>{findings} linked findings</small></div><div><span>Line match rate</span><strong>100%</strong><small>8,440 normalized lines</small></div><div><span>Audit state</span><strong>{status}</strong><small>Rule set logistics-v3</small></div></section>
      <section className="detail-layout">
        <div className="detail-main">
          <article className="panel"><div className="panel-title-row"><div><span className="panel-kicker">Line-level audit</span><h3>Charges and expected cost</h3></div><span className="sample-label">Sample normalized lines</span></div><div className="table-wrap"><table><thead><tr><th>Line</th><th>Charge type</th><th>Quantity</th><th>Billed rate</th><th>Contract rate</th><th>Billed</th><th>Expected</th><th>Variance</th></tr></thead><tbody>
            {[["00142","Residential surcharge","1","$11.68","$4.15","$11.68","$4.15","$7.53"],["00143","Base transportation","1","$18.20","$18.20","$18.20","$18.20","$0.00"],["00144","Fuel surcharge","1","$3.41","$3.41","$3.41","$3.41","$0.00"]].map((row)=><tr key={row[0]}>{row.map((cell,index)=><td className={index===7&&cell!=="$0.00"?"money-good":undefined} key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}
          </tbody></table></div></article>
        </div>
        <aside className="detail-side"><article className="panel"><span className="panel-kicker">Audit lineage</span><div className="action-list"><div className="resource-line"><FileText size={16}/><div><strong>Source invoice</strong><small>{number}.pdf · SHA-256 stored</small></div></div><div className="resource-line"><FileCheck2 size={16}/><div><strong>Matched agreement</strong><small>{contract}</small></div></div><div className="resource-line"><ShieldCheck size={16}/><div><strong>Rules evaluated</strong><small>12 deterministic rules · v3</small></div></div></div></article></aside>
      </section>
    </>
  );
}
