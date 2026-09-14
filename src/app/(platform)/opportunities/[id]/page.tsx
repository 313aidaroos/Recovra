import { notFound } from "next/navigation";
import { FindingDetail } from "@/components/live/finding-detail";
import { OpportunityDetail } from "@/components/recovery/opportunity-detail";
import { getWorkspace } from "@/lib/auth/workspace";
import { loadFindingDetail } from "@/lib/db/findings";
import { createSignedDocumentUrl } from "@/lib/db/resources";
import { opportunities } from "@/lib/platform-data";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspace = await getWorkspace();

  if (workspace.mode === "live" && UUID.test(id)) {
    const data = await loadFindingDetail(workspace, id);
    if (!data) notFound();
    const links = await Promise.all(data.documents.map(async (document) => [document.id, await createSignedDocumentUrl(workspace, document)] as const));
    return <FindingDetail data={data} role={workspace.role} documentLinks={Object.fromEntries(links)}/>;
  }

  const opportunity = opportunities.find((item) => item.id === id);
  if (!opportunity) notFound();
  return <OpportunityDetail opportunity={opportunity}/>;
}
