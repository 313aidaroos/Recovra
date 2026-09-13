import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CLAIM_READY_STATUSES, ClaimPacket } from "@/components/live/claim-packet";
import { getWorkspace, writeAuditLog } from "@/lib/auth/workspace";
import { loadFindingDetail } from "@/lib/db/findings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Claim packet", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Printable claim package for an approved finding. Gated on the human approval step: until an
 * approver has authorised the amount there is nothing to send, so the page refuses to render one.
 */
export default async function ClaimPacketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspace = await getWorkspace();
  if (workspace.mode === "demo") redirect("/login");
  if (workspace.mode === "onboarding") redirect("/onboarding");
  if (workspace.mode !== "live" || !UUID.test(id)) notFound();

  const data = await loadFindingDetail(workspace, id);
  if (!data) notFound();

  const status = data.recovery?.status ?? "detected";
  if (!CLAIM_READY_STATUSES.has(status)) {
    return (
      <main className="claim-packet">
        <div className="claim-toolbar no-print"><Link href={`/opportunities/${id}`}>← Back to finding</Link></div>
        <section className="claim-letter claim-blocked">
          <h1>Approval required before a claim packet can be generated</h1>
          <p>This case is currently <strong>{status.replace(/_/g, " ")}</strong>. An owner, admin or finance member must approve the amount on the finding page first. Recovra never prepares or sends a vendor claim without that step.</p>
          <p><Link href={`/opportunities/${id}`}>Open the finding to verify evidence and request approval →</Link></p>
        </section>
      </main>
    );
  }

  const generatedAt = new Date().toISOString();
  await writeAuditLog(workspace, "claim.packet_generated", { type: "finding", id }, { recoveryId: data.recovery?.id ?? null, status, amount: data.recovery?.approved_amount ?? data.finding.variance_amount, generatedAt });
  return <ClaimPacket data={data} organization={workspace.organization} generatedAt={generatedAt}/>;
}
