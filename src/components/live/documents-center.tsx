import { FileText, LockKeyhole, ScanLine, ShieldCheck } from "lucide-react";
import type { DocumentListItem } from "@/lib/db/resources";
import { formatDateTime, titleCase } from "@/lib/format";
import { PageHeader } from "../ui/page-header";
import { StatusBadge } from "../ui/status-badge";
import { UploadForm } from "./upload-form";

const statusTone = (status: string) => status === "complete" || status === "stored" ? "good" : status === "needs_review" || status === "parsing" ? "warn" : status === "failed" ? "risk" : "neutral";

function describeMetadata(document: DocumentListItem) {
  const metadata = document.metadata ?? {};
  const parts: string[] = [];
  if (typeof metadata.invoices === "number") parts.push(`${metadata.invoices} invoice${metadata.invoices === 1 ? "" : "s"}`);
  if (typeof metadata.contracts === "number") parts.push(`${metadata.contracts} agreement${metadata.contracts === 1 ? "" : "s"}`);
  if (typeof metadata.terms === "number") parts.push(`${metadata.terms} terms`);
  if (typeof metadata.findings === "number") parts.push(`${metadata.findings} finding${metadata.findings === 1 ? "" : "s"}`);
  if (typeof metadata.rowsRead === "number") parts.push(`${metadata.rowsRead} rows read`);
  if (typeof metadata.error === "string") parts.push(metadata.error);
  return parts.join(" · ") || "—";
}

export function DocumentsCenter({ documents, currency, canUpload, signedUrls }: { documents: DocumentListItem[]; currency: string; canUpload: boolean; signedUrls: Record<string, string | null> }) {
  const counts = {
    total: documents.length,
    processing: documents.filter((document) => document.status === "parsing" || document.status === "uploaded").length,
    review: documents.filter((document) => document.status === "needs_review" || document.status === "failed").length,
    complete: documents.filter((document) => document.status === "complete" || document.status === "stored").length,
  };

  return (
    <>
      <PageHeader eyebrow="Document intelligence" title="Document Center" description="Upload the source evidence behind every recovery. Files live in a private, tenant-isolated bucket; CSV/XLSX invoices and rate sheets are parsed and audited on upload."/>
      <section className="document-stats">
        <div><strong>{counts.total}</strong><span>Documents stored</span></div>
        <div><strong>{counts.complete}</strong><span>Processed</span></div>
        <div><strong>{counts.review}</strong><span>Need review</span></div>
        <div><strong>{counts.processing}</strong><span>Processing</span></div>
      </section>
      <section className="ingest-grid">
        <UploadForm currency={currency} canUpload={canUpload}/>
        <article className="panel extraction-flow">
          <span className="panel-kicker">What happens on upload</span>
          <div className="pipeline-steps">
            <div><span><LockKeyhole size={16}/></span><div><strong>Stored privately</strong><small>Path scoped to your organization; SHA-256 fingerprint recorded for provenance and duplicate protection.</small></div><i/></div>
            <div><span><ScanLine size={16}/></span><div><strong>Parsed deterministically</strong><small>Column headers are normalized against known aliases; every row keeps its source locator.</small></div><i/></div>
            <div><span><ShieldCheck size={16}/></span><div><strong>Audited against contract terms</strong><small>Rate, fuel percentage, free-time, unapproved accessorial and duplicate rules run with fixed-point math.</small></div><i/></div>
            <div><span><FileText size={16}/></span><div><strong>Findings open recovery cases</strong><small>Each finding is evidence-linked and waits for human review before any claim is prepared.</small></div><i/></div>
          </div>
          <p>PDF contracts and scanned invoices are stored with provenance today; structured extraction for those formats activates when an AI provider key is configured for the Document Agent.</p>
        </article>
      </section>
      <section className="panel document-table">
        <div className="panel-title-row"><div><span className="panel-kicker">Document ledger</span><h3>Uploaded files</h3></div><span className="sample-label live">Live data</span></div>
        <div className="table-wrap"><table><thead><tr><th>Document</th><th>Type</th><th>Vendor</th><th>Status</th><th>Result</th><th>Uploaded</th><th>File</th></tr></thead><tbody>
          {documents.length === 0 && <tr><td colSpan={7} className="table-empty">No documents uploaded yet.</td></tr>}
          {documents.map((document) => (
            <tr key={document.id}>
              <td><strong>{document.filename}</strong><small className="cell-sub">{document.sha256 ? `SHA-256 ${document.sha256.slice(0, 16)}…` : ""}</small></td>
              <td><span className="module-pill">{titleCase(document.kind)}</span></td>
              <td>{document.vendorName ?? <span className="muted">—</span>}</td>
              <td><StatusBadge tone={statusTone(document.status)}>{titleCase(document.status)}</StatusBadge></td>
              <td><span className="muted">{describeMetadata(document)}</span></td>
              <td>{formatDateTime(document.created_at)}</td>
              <td>{signedUrls[document.id] ? <a className="table-action" href={signedUrls[document.id] ?? undefined} target="_blank" rel="noreferrer">Open</a> : <span className="muted">—</span>}</td>
            </tr>
          ))}
        </tbody></table></div>
      </section>
    </>
  );
}
