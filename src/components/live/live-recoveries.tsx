import Link from "next/link";
import { CheckCircle2, Send, ShieldCheck } from "lucide-react";
import type { PipelineStage } from "@/lib/db/dashboard";
import type { FindingListItem } from "@/lib/db/findings";
import { formatMoney, titleCase } from "@/lib/format";
import { addDecimal, isZero } from "@/lib/recovery-engine";
import { PageHeader } from "../ui/page-header";
import { StatusBadge } from "../ui/status-badge";
import { EmptyState } from "./empty-state";

const BOARD_ORDER = ["detected", "reviewing", "verified", "approval_requested", "approved", "submitted", "recovered"];

export function LiveRecoveries({ rows, pipeline, currency }: { rows: FindingListItem[]; pipeline: PipelineStage[]; currency: string }) {
  const byStatus = new Map(pipeline.map((stage) => [stage.status, stage]));
  const board = BOARD_ORDER.map((status) => byStatus.get(status)).filter((stage): stage is PipelineStage => Boolean(stage));
  const sum = (statuses: string[]) => statuses.reduce((total, status) => addDecimal(total, byStatus.get(status)?.amount ?? "0"), "0");
  const verified = sum(["verified", "approval_requested", "approved", "submitted", "vendor_reviewing", "recovered"]);
  const submitted = sum(["submitted", "vendor_reviewing", "recovered"]);
  const recovered = sum(["recovered"]);
  const active = rows.filter((row) => row.recoveryStatus !== "closed" && row.recoveryStatus !== "rejected");

  return (
    <>
      <PageHeader eyebrow="Recovery center" title="From finding to money recovered." description="Every case moves through review, evidence confirmation and a human approval before anyone submits a claim to a vendor. Recovra never sends claims on your behalf."/>
      <section className="pipeline-board">
        {board.map((stage, index) => <div key={stage.status}><span>{index + 1}</span><small>{stage.label}</small><strong>{formatMoney(stage.amount, currency)}</strong><em>{stage.count} case{stage.count === 1 ? "" : "s"}</em>{index < board.length - 1 && <i/>}</div>)}
      </section>
      <section className="recovery-summary">
        <article className="panel"><ShieldCheck size={18}/><div><span>Verified opportunity</span><strong>{formatMoney(verified, currency)}</strong></div><small>Human-verified</small></article>
        <article className="panel"><Send size={18}/><div><span>Submitted to vendors</span><strong>{formatMoney(submitted, currency)}</strong></div><small>Recorded by your team</small></article>
        <article className="panel"><CheckCircle2 size={18}/><div><span>Realized recovery</span><strong>{formatMoney(recovered, currency)}</strong></div><small>{isZero(recovered) ? "Nothing realized yet" : "Savings ledger"}</small></article>
      </section>
      {rows.length === 0 ? (
        <EmptyState title="No recovery cases yet" description="A recovery case opens automatically for every finding produced by an audit. Upload a rate sheet and an invoice to get started."/>
      ) : (
        <section className="panel resource-panel">
          <div className="active-filters"><span>Live tenant data</span><span>Sorted by value</span><small>{active.length} active · {rows.length - active.length} closed or rejected</small></div>
          <div className="table-wrap"><table><thead><tr><th>Case / Vendor</th><th>Issue</th><th>Module</th><th>Owner</th><th>Evidence</th><th>Status</th><th>Value</th></tr></thead><tbody>
            {rows.map((item) => <tr key={item.id}><td><Link href={`/opportunities/${item.id}`}><strong>{item.recoveryId ? `RC-${item.recoveryId.slice(0, 8).toUpperCase()}` : "Pending case"}</strong><small className="cell-sub">{item.vendor}</small></Link></td><td>{item.title}</td><td><span className="module-pill">{titleCase(item.module)}</span></td><td>{item.ownerName ?? <span className="muted">Unassigned</span>}</td><td>{item.evidenceCount} items</td><td><StatusBadge>{item.recoveryStatusLabel}</StatusBadge></td><td className="money-good">{formatMoney(item.variance, item.currency, { cents: true })}</td></tr>)}
          </tbody></table></div>
        </section>
      )}
    </>
  );
}
