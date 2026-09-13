"use client";

import { useActionState, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, UploadCloud } from "lucide-react";
import Link from "next/link";
import { uploadDocumentAction, type UploadState } from "@/lib/ingestion/actions";
import { formatMoney } from "@/lib/format";

const initial: UploadState = { status: "idle" };

export function UploadForm({ currency, canUpload, pdfExtraction }: { currency: string; canUpload: boolean; pdfExtraction: boolean }) {
  const [state, action, pending] = useActionState(uploadDocumentAction, initial);
  const [kind, setKind] = useState("invoice");
  const [fileName, setFileName] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  return (
    <article className="panel upload-panel">
      <div className="panel-title-row"><div><span className="panel-kicker">Secure ingestion</span><h3>Upload a document</h3></div><span className="sample-label live">Private storage</span></div>
      {!canUpload ? (
        <p className="muted-note">Your role can view documents but not upload them. Ask an owner, admin, finance, analyst or operations member.</p>
      ) : (
        <form action={action} className="workflow-form">
          <label className="field-label">Document type
            <select name="kind" value={kind} onChange={(event) => setKind(event.target.value)}>
              <option value="invoice">{pdfExtraction ? "Invoice (CSV/XLSX/PDF audited on upload)" : "Invoice (CSV/XLSX audited immediately)"}</option>
              <option value="rate_sheet">Rate sheet / contract terms (CSV/XLSX)</option>
              <option value="contract">Contract document (PDF, stored for review)</option>
              <option value="operational">Operational data (tracking, POD, dwell)</option>
              <option value="other">Other supporting evidence</option>
            </select>
          </label>
          <label className="field-label">Vendor / carrier name <small>optional — overrides the vendor column</small>
            <input name="vendor" placeholder="e.g. Maersk, Hapag-Lloyd, Old Dominion"/>
          </label>
          {kind === "rate_sheet" && (
            <label className="field-label">Agreement title <small>re-uploading the same title supersedes the older version</small>
              <input name="contract_title" placeholder="e.g. 2026 Transpacific FAK Tariff"/>
            </label>
          )}
          <button type="button" className="dropzone compact" onClick={() => input.current?.click()}>
            <UploadCloud size={26}/>
            <strong>{fileName ?? "Choose a CSV, XLSX or PDF"}</strong>
            <span>Up to 25 MB · SHA-256 fingerprint prevents duplicate ingestion</span>
            <input ref={input} type="file" name="file" accept=".csv,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,text/csv,application/pdf" hidden onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}/>
          </button>
          <button className="primary-button wide" type="submit" disabled={pending || !fileName}>{pending ? "Uploading and auditing…" : "Upload & audit"}</button>
          <p className="muted-note"><FileSpreadsheet size={13}/> Templates: <Link className="text-link" href="/templates/recovra-invoice-template.csv">invoice CSV</Link> · <Link className="text-link" href="/templates/recovra-rate-sheet-template.csv">rate sheet CSV</Link></p>
        </form>
      )}
      <UploadResult state={state} currency={currency}/>
    </article>
  );
}

function UploadResult({ state, currency }: { state: UploadState; currency: string }) {
  if (state.status === "idle") return null;
  if (state.status === "error") return <p className="form-status error" role="alert"><AlertTriangle size={14}/> {state.error}</p>;
  if (state.status === "duplicate") return <p className="form-status error" role="status"><AlertTriangle size={14}/> {state.note}</p>;
  return (
    <div className="upload-result" role="status">
      <p className="form-status success"><CheckCircle2 size={14}/> {state.filename} stored securely.</p>
      {state.invoices?.map((invoice) => (
        <div className="resource-line" key={invoice.invoiceId}>
          <FileSpreadsheet size={16}/>
          <div>
            <strong><Link className="text-link" href={`/invoices/${invoice.invoiceId}`}>Invoice {invoice.invoiceNumber}</Link> · {invoice.vendor}</strong>
            <small>{invoice.lines} lines · {formatMoney(invoice.total, currency, { cents: true })} billed · {invoice.audit.findings} finding{invoice.audit.findings === 1 ? "" : "s"} · {formatMoney(invoice.audit.totalVariance, currency, { cents: true })} variance</small>
          </div>
        </div>
      ))}
      {state.contracts?.map((contract) => (
        <div className="resource-line" key={contract.contractId}>
          <FileSpreadsheet size={16}/>
          <div>
            <strong><Link className="text-link" href={`/contracts/${contract.contractId}`}>{contract.title}</Link> · {contract.vendor}</strong>
            <small>{contract.terms} contract term{contract.terms === 1 ? "" : "s"} now active for audits</small>
          </div>
        </div>
      ))}
      {state.note && <p className="muted-note">{state.note}</p>}
      {state.warnings && state.warnings.length > 0 && (
        <details className="muted-note"><summary>{state.warnings.length} row warning{state.warnings.length === 1 ? "" : "s"}</summary><ul>{state.warnings.slice(0, 20).map((warning) => <li key={warning}>{warning}</li>)}</ul></details>
      )}
    </div>
  );
}
