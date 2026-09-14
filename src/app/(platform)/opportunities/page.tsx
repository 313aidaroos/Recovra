import { Download, Plus, UploadCloud } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/live/empty-state";
import { FindingsTable } from "@/components/live/findings-table";
import { OpportunitiesTable } from "@/components/recovery/opportunities-table";
import { PageHeader } from "@/components/ui/page-header";
import { getWorkspace } from "@/lib/auth/workspace";
import { loadFindings } from "@/lib/db/findings";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<{ recoverability?: string }> }) {
  const workspace = await getWorkspace();
  if (workspace.mode !== "live") {
    return (
      <>
        <PageHeader
          eyebrow="Recovery operations"
          title="Recovery Opportunities"
          description="Prioritize, verify, and move evidence-backed findings from detection to realized value."
          actions={<><button className="secondary-button tall"><Download size={15}/> Export</button><button className="primary-button"><Plus size={15}/> New review</button></>}
        />
        <OpportunitiesTable/>
      </>
    );
  }

  const { recoverability } = await searchParams;
  const rows = await loadFindings(workspace);
  return (
    <>
      <PageHeader
        eyebrow="Recovery operations"
        title="Recovery Opportunities"
        description="Every finding below was computed deterministically from your invoices and contract terms, with evidence attached. Verify, approve and track each one to recovered money."
        actions={<Link className="primary-button" href="/documents"><UploadCloud size={15}/> Upload documents</Link>}
      />
      {rows.length === 0
        ? <EmptyState title="No findings yet" description="Upload a rate sheet and an invoice. Findings appear here ranked by recoverable value as soon as the audit completes."/>
        : <FindingsTable rows={rows} initialRecoverability={recoverability === "needs_review" || recoverability === "recoverable" ? recoverability : "all"}/>}
    </>
  );
}
