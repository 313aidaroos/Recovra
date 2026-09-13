import { DocumentsCenter } from "@/components/live/documents-center";
import { UploadCenter } from "@/components/upload-center";
import { getWorkspace } from "@/lib/auth/workspace";
import { createSignedDocumentUrl, loadDocuments } from "@/lib/db/resources";
import { isPdfExtractionConfigured } from "@/lib/ingestion/pdf-extractor";
import { WRITER_ROLES } from "@/types/workspace";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const workspace = await getWorkspace();
  if (workspace.mode !== "live") return <UploadCenter/>;
  const documents = await loadDocuments(workspace);
  const links = await Promise.all(documents.slice(0, 50).map(async (document) => [document.id, await createSignedDocumentUrl(workspace, document)] as const));
  return <DocumentsCenter documents={documents} currency={workspace.organization.currency} canUpload={WRITER_ROLES.includes(workspace.role)} signedUrls={Object.fromEntries(links)} pdfExtraction={isPdfExtractionConfigured()}/>;
}
