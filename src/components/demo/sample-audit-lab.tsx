"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Calculator, CheckCircle2, FileSpreadsheet, LockKeyhole, Play, UploadCloud } from "lucide-react";
import { formatMoney, formatPercent, titleCase } from "@/lib/format";
import type { SampleAuditResult } from "@/lib/demo/sample-audit";

type ApiResponse = {
  demo?: boolean;
  claimsSent?: boolean;
  message?: string;
  error?: string;
  result?: SampleAuditResult;
  persistence?: { persisted: true; id: string } | { persisted: false; reason: string };
};

export function SampleAuditLab() {
  const invoiceInput = useRef<HTMLInputElement>(null);
  const rateInput = useRef<HTMLInputElement>(null);
  const [invoiceName, setInvoiceName] = useState<string | null>(null);
  const [rateName, setRateName] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SampleAuditResult | null>(null);
  const [persistence, setPersistence] = useState<ApiResponse["persistence"]>();

  async function run(kind: "sample" | "upload") {
    setPending(true);
    setError(null);
    try {
      let response: Response;
      if (kind === "sample") {
        response = await fetch("/api/demo/analyze", { method: "GET", cache: "no-store" });
      } else {
        const invoice = invoiceInput.current?.files?.[0];
        if (!invoice) {
          setError("Choose an invoice CSV or XLSX, or run the bundled sample.");
          setPending(false);
          return;
        }
        const form = new FormData();
        form.set("invoice", invoice);
        const rateSheet = rateInput.current?.files?.[0];
        if (rateSheet) form.set("rate_sheet", rateSheet);
        response = await fetch("/api/demo/analyze", { method: "POST", body: form });
      }
      const body = (await response.json()) as ApiResponse;
      if (!response.ok || !body.result) {
        setError(body.error ?? "Audit failed.");
        setResult(null);
        return;
      }
      setResult(body.result);
      setPersistence(body.persistence);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Network error.");
      setResult(null);
    } finally {
      setPending(false);
    }
  }

  const selectedFindingCount = result?.totals.findings ?? 0;

  return (
    <div className="audit-lab">
      <section className="audit-hero">
        <span className="sample-label">Demo · not a live tenant</span>
        <h1>Intake → finding, with an evidence trail.</h1>
        <p>Upload an invoice CSV and optional rate sheet, or run the bundled sample. Recovra parses the rows, runs the deterministic recovery engine, and shows billed vs expected with source locators. Amounts are calculated, never invented. Claims are not sent from this page.</p>
      </section>

      <section className="audit-grid">
        <article className="panel upload-panel">
          <div className="panel-title-row"><div><span className="panel-kicker">1. Intake</span><h3>Source documents</h3></div></div>
          <button type="button" className="dropzone compact" onClick={() => invoiceInput.current?.click()}>
            <UploadCloud size={26}/>
            <strong>{invoiceName ?? "Invoice CSV / XLSX"}</strong>
            <span>Required for a custom run · up to 2 MB · not stored</span>
            <input ref={invoiceInput} type="file" accept=".csv,.xlsx,text/csv" hidden onChange={(event) => setInvoiceName(event.target.files?.[0]?.name ?? null)}/>
          </button>
          <button type="button" className="dropzone compact" onClick={() => rateInput.current?.click()}>
            <FileSpreadsheet size={26}/>
            <strong>{rateName ?? "Rate sheet CSV / XLSX (optional)"}</strong>
            <span>Needed for contracted-rate findings</span>
            <input ref={rateInput} type="file" accept=".csv,.xlsx,text/csv" hidden onChange={(event) => setRateName(event.target.files?.[0]?.name ?? null)}/>
          </button>
          <div className="audit-actions">
            <button className="primary-button wide" type="button" disabled={pending} onClick={() => run("sample")}>
              <Play size={15}/> {pending ? "Auditing…" : "Run bundled sample"}
            </button>
            <button className="secondary-button tall" type="button" disabled={pending || !invoiceName} onClick={() => run("upload")}>
              Audit my files
            </button>
          </div>
          <p className="muted-note">Templates: <Link className="text-link" href="/templates/recovra-invoice-template.csv">invoice CSV</Link> · <Link className="text-link" href="/templates/recovra-rate-sheet-template.csv">rate sheet CSV</Link></p>
        </article>

        <article className="panel">
          <div className="panel-title-row"><div><span className="panel-kicker">What this proves</span><h3>Engine, not a mock</h3></div></div>
          <ol className="audit-steps">
            <li><strong>Parse</strong> invoice and rate-sheet rows with locators such as row:3.</li>
            <li><strong>Match</strong> charge codes and lane dimensions to contract terms.</li>
            <li><strong>Calculate</strong> expected cost with fixed-point decimal math.</li>
            <li><strong>Evidence</strong> every finding to invoice + rate-sheet locators.</li>
            <li><strong>Stop</strong> before any vendor claim — human approval required.</li>
          </ol>
        </article>
      </section>

      {error && <p className="form-status error" role="alert"><AlertTriangle size={14}/> {error}</p>}

      {result && <AuditResult result={result} findingCount={selectedFindingCount} persistence={persistence}/>}
    </div>
  );
}

function AuditResult({ result, findingCount, persistence }: { result: SampleAuditResult; findingCount: number; persistence?: ApiResponse["persistence"] }) {
  const [openKey, setOpenKey] = useState<string | null>(result.invoices[0]?.findings[0]?.dedupeKey ?? null);
  const findings = useMemo(() => result.invoices.flatMap((invoice) => invoice.findings.map((finding) => ({ invoice, finding }))), [result]);

  return (
    <section className="audit-result">
      <div className="detail-metrics">
        <div><span>Billed (from rows)</span><strong>{formatMoney(result.totals.billed, result.invoices[0]?.currency ?? "USD", { cents: true })}</strong><small>{result.rowsRead.invoices} invoice rows</small></div>
        <div><span>Variance found</span><strong className="money-good">{formatMoney(result.totals.variance, result.invoices[0]?.currency ?? "USD", { cents: true })}</strong><small>{findingCount} finding{findingCount === 1 ? "" : "s"}</small></div>
        <div><span>Recoverable quality</span><strong>{result.totals.recoverable}</strong><small>{result.totals.needsReview} need review</small></div>
        <div><span>Claims sent</span><strong>0</strong><small>Human approval required</small></div>
      </div>
      <p className="form-status success"><CheckCircle2 size={14}/> {result.message}</p>
      {persistence?.persisted ? (
        <p className="muted-note">Saved to Recovra Postgres as demo run {persistence.id}. Labeled demo. Claims sent: 0.</p>
      ) : persistence && !persistence.persisted ? (
        <p className="muted-note">{persistence.reason}</p>
      ) : null}
      {result.warnings.length > 0 && (
        <details className="muted-note"><summary>{result.warnings.length} parser warning{result.warnings.length === 1 ? "" : "s"}</summary><ul>{result.warnings.slice(0, 20).map((warning) => <li key={warning}>{warning}</li>)}</ul></details>
      )}

      {result.invoices.map((invoice) => (
        <article className="panel" key={invoice.invoiceId}>
          <div className="panel-title-row">
            <div><span className="panel-kicker">Invoice {invoice.invoiceNumber}</span><h3>{invoice.vendor}</h3></div>
            <small>{invoice.lineCount} lines · {formatMoney(invoice.billedTotal, invoice.currency, { cents: true })} billed · {invoice.findings.length} findings</small>
          </div>
          {invoice.findings.length === 0 ? <p className="muted-note">No variance on this invoice against the loaded terms.</p> : (
            <div className="table-wrap"><table><thead><tr><th>Finding</th><th>Billed</th><th>Expected</th><th>Variance</th><th>Quality</th><th>Evidence</th></tr></thead>
              <tbody>
                {invoice.findings.map((finding) => (
                  <tr key={finding.dedupeKey} className={openKey === finding.dedupeKey ? "selected-row" : undefined} onClick={() => setOpenKey(finding.dedupeKey)}>
                    <td><strong>{finding.title}</strong><small className="table-sub">{finding.ruleId}@{finding.ruleVersion}</small></td>
                    <td>{formatMoney(finding.actualValue, finding.currency, { cents: true })}</td>
                    <td>{finding.expectedValue === null ? "Review" : formatMoney(finding.expectedValue, finding.currency, { cents: true })}</td>
                    <td>{formatMoney(finding.variance, finding.currency, { cents: true })}</td>
                    <td>{finding.recoverability === "recoverable" ? "Recoverable" : "Needs review"} · {formatPercent(finding.confidence)}</td>
                    <td>{finding.evidenceReferences.length}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </article>
      ))}

      {findings.map(({ invoice, finding }) => openKey === finding.dedupeKey ? (
        <article className="panel explanation-panel" key={`detail-${finding.dedupeKey}`}>
          <div className="panel-title-row"><div><span className="panel-kicker">Evidence trail · {invoice.invoiceNumber}</span><h3>{finding.title}</h3></div><span className="ai-label"><Calculator size={14}/> Amounts from calculation trace</span></div>
          <p>{finding.explanation}</p>
          <div className="calculation-strip">
            <div><small>Billed</small><strong>{formatMoney(finding.actualValue, finding.currency, { cents: true })}</strong></div><span>−</span>
            <div><small>Expected</small><strong>{finding.expectedValue === null ? "Not determinable" : formatMoney(finding.expectedValue, finding.currency, { cents: true })}</strong></div><span>=</span>
            <div className="variance"><small>Variance</small><strong>{formatMoney(finding.variance, finding.currency, { cents: true })}</strong></div>
          </div>
          <div className="rule-trace">
            <Calculator size={17}/>
            <div>
              <strong>{finding.calculationTrace.ruleVersion}</strong>
              <small>{finding.calculationTrace.formula}</small>
              <small className="operands">{Object.entries(finding.calculationTrace.operands).map(([key, value]) => `${key} = ${value}`).join(" · ")}</small>
            </div>
          </div>
          <div className="evidence-grid">
            {finding.evidenceReferences.map((reference, index) => (
              <div key={`${reference.documentId}-${reference.locator}-${index}`}>
                <span><FileSpreadsheet size={18}/></span>
                <div><small>{titleCase(reference.kind)}</small><strong>{reference.label}</strong><p>{reference.locator} · {reference.documentId}</p></div>
              </div>
            ))}
          </div>
          <p className="muted-note"><LockKeyhole size={13}/> Demo finding. Sign in to persist this audit and request recovery after a person approves it. <Link className="text-link" href="/signup">Create a workspace</Link></p>
        </article>
      ) : null)}
    </section>
  );
}
