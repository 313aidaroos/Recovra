import { notFound } from "next/navigation";
import { ContractDetail } from "@/components/live/contract-detail";
import { getWorkspace } from "@/lib/auth/workspace";
import { createSignedDocumentUrl, loadContractDetail } from "@/lib/db/resources";

export const dynamic = "force-dynamic";

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspace = await getWorkspace();
  if (workspace.mode !== "live") notFound();
  const data = await loadContractDetail(workspace, id);
  if (!data) notFound();
  const documentUrl = data.document ? await createSignedDocumentUrl(workspace, data.document) : null;
  return <ContractDetail data={data} documentUrl={documentUrl}/>;
}
