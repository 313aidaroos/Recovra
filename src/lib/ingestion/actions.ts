"use server";

import { revalidatePath } from "next/cache";
import { auditInvoice, type AuditSummary } from "@/lib/audit/run-audit";
import { requireLiveWorkspace, WorkspaceAccessError, writeAuditLog, type LiveWorkspace } from "@/lib/auth/workspace";
import { ensureVendor } from "@/lib/db/vendors";
import type { DocumentRow } from "@/lib/db/types";
import { termKey } from "@/lib/recovery-engine";
import { WRITER_ROLES } from "@/types/workspace";
import { parseInvoiceTables, type ParsedInvoice } from "./invoice-parser";
import { parseRateSheetTables, type ParsedRateSheet } from "./rate-sheet-parser";
import { isSpreadsheetFile, parseTabularFile } from "./tabular";

export type DocumentKind = "invoice" | "rate_sheet" | "contract" | "operational" | "other";
const DOCUMENT_KINDS: DocumentKind[] = ["invoice", "rate_sheet", "contract", "operational", "other"];
const MAX_BYTES = 25 * 1024 * 1024;

export type UploadState = {
  status: "idle" | "ok" | "duplicate" | "error";
  documentId?: string;
  filename?: string;
  error?: string;
  warnings?: string[];
  invoices?: Array<{ invoiceId: string; invoiceNumber: string; vendor: string; total: string; lines: number; audit: AuditSummary }>;
  contracts?: Array<{ contractId: string; title: string; vendor: string; terms: number }>;
  note?: string;
};

async function sha256Hex(bytes: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "upload";
}

export async function uploadDocumentAction(_previous: UploadState, formData: FormData): Promise<UploadState> {
  let workspace: LiveWorkspace;
  try {
    workspace = await requireLiveWorkspace(WRITER_ROLES);
  } catch (error) {
    return { status: "error", error: error instanceof WorkspaceAccessError ? error.message : "Not authorised." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { status: "error", error: "Choose a file to upload." };
  if (file.size > MAX_BYTES) return { status: "error", error: "Files are limited to 25 MB." };
  const kindInput = String(formData.get("kind") ?? "invoice") as DocumentKind;
  const kind: DocumentKind = DOCUMENT_KINDS.includes(kindInput) ? kindInput : "other";
  const vendorName = String(formData.get("vendor") ?? "").trim();
  const contractTitle = String(formData.get("contract_title") ?? "").trim();

  const { supabase, organization } = workspace;
  const bytes = await file.arrayBuffer();
  const sha256 = await sha256Hex(bytes);

  const { data: existing } = await supabase
    .from("documents").select("id, filename, status, storage_path").eq("organization_id", organization.id).eq("sha256", sha256).maybeSingle();
  if (existing) {
    const row = existing as Pick<DocumentRow, "id" | "filename" | "status" | "storage_path">;
    if (row.status !== "failed") {
      return { status: "duplicate", documentId: row.id, filename: row.filename, note: `This exact file (SHA-256 ${sha256.slice(0, 12)}…) was already ingested as ${row.filename}. Nothing was changed.` };
    }
    // A previous attempt failed part-way: release it (and anything derived from it) so the retry is clean.
    const { error: discardError } = await supabase.rpc("discard_failed_document", { p_document: row.id, p_delete_document: true });
    if (discardError) return { status: "error", error: `Could not clear the earlier failed upload: ${discardError.message}` };
  }

  const { data: created, error: createError } = await supabase
    .from("documents")
    .insert({ organization_id: organization.id, kind, filename: file.name, storage_path: "pending", sha256, status: "uploaded", created_by: workspace.user.id, metadata: { size: file.size, mimeType: file.type } })
    .select("id").single();
  if (createError || !created) return { status: "error", error: `Could not register document: ${createError?.message ?? "unknown"}` };
  const documentId = (created as { id: string }).id;
  const storagePath = `${organization.id}/${documentId}/${safeFilename(file.name)}`;

  const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, bytes, { contentType: file.type || "application/octet-stream", upsert: false });
  if (uploadError) {
    await supabase.from("documents").delete().eq("id", documentId);
    return { status: "error", error: `Storage upload failed: ${uploadError.message}` };
  }
  await supabase.from("documents").update({ storage_path: storagePath, status: "parsing" }).eq("id", documentId);
  await writeAuditLog(workspace, "document.uploaded", { type: "document", id: documentId }, { filename: file.name, kind, sha256, size: file.size });

  const result: UploadState = { status: "ok", documentId, filename: file.name, warnings: [] };

  try {
    if ((kind === "invoice" || kind === "rate_sheet") && isSpreadsheetFile(file.name, file.type)) {
      const tables = await parseTabularFile(file.name, bytes);
      if (kind === "invoice") {
        const parsed = parseInvoiceTables(tables, { vendorName: vendorName || undefined, currency: organization.currency, fallbackInvoiceNumber: file.name.replace(/\.[^.]+$/, "") });
        result.warnings = parsed.warnings;
        result.invoices = [];
        for (const invoice of parsed.invoices) {
          result.invoices.push(await persistInvoice(workspace, documentId, invoice));
        }
        const findings = result.invoices.reduce((total, invoice) => total + invoice.audit.findings, 0);
        await supabase.from("documents").update({
          status: parsed.invoices.length === 0 ? "needs_review" : parsed.warnings.length > 0 ? "needs_review" : "complete",
          vendor_id: result.invoices.length === 1 ? await vendorIdFor(workspace, result.invoices[0].vendor) : null,
          metadata: { size: file.size, mimeType: file.type, rowsRead: parsed.rowsRead, invoices: parsed.invoices.length, findings, warnings: parsed.warnings.slice(0, 50) },
        }).eq("id", documentId);
        if (parsed.invoices.length === 0) result.note = "No invoice rows could be read. Check the column headers against the template.";
      } else {
        const parsed = parseRateSheetTables(tables, { vendorName: vendorName || undefined, contractTitle: contractTitle || file.name.replace(/\.[^.]+$/, ""), currency: organization.currency });
        result.warnings = parsed.warnings;
        result.contracts = [];
        for (const sheet of parsed.sheets) {
          result.contracts.push(await persistRateSheet(workspace, documentId, sheet));
        }
        await supabase.from("documents").update({
          status: parsed.sheets.length === 0 ? "needs_review" : parsed.warnings.length > 0 ? "needs_review" : "complete",
          vendor_id: result.contracts.length === 1 ? await vendorIdFor(workspace, result.contracts[0].vendor) : null,
          metadata: { size: file.size, mimeType: file.type, rowsRead: parsed.rowsRead, contracts: parsed.sheets.length, terms: result.contracts.reduce((total, contract) => total + contract.terms, 0), warnings: parsed.warnings.slice(0, 50) },
        }).eq("id", documentId);
        if (parsed.sheets.length === 0) result.note = "No rate rows could be read. Check the column headers against the template.";
      }
    } else {
      await supabase.from("documents").update({
        status: "stored",
        vendor_id: vendorName ? (await ensureVendor(workspace, vendorName)).id : null,
        metadata: { size: file.size, mimeType: file.type, note: "Stored with provenance. Structured extraction for this file type requires the Document Agent (AI provider credentials)." },
      }).eq("id", documentId);
      result.note = "Stored securely with SHA-256 provenance. PDF and image extraction is queued for the Document Agent once an AI provider key is configured; CSV/XLSX files are audited immediately.";
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Processing failed.";
    // Remove partially ingested invoices/contracts so nothing half-audited is reported as real data.
    await supabase.from("documents").update({ status: "failed", metadata: { size: file.size, mimeType: file.type, error: message } }).eq("id", documentId);
    await supabase.rpc("discard_failed_document", { p_document: documentId, p_delete_document: false });
    await writeAuditLog(workspace, "document.failed", { type: "document", id: documentId }, { filename: file.name, error: message });
    return { status: "error", documentId, filename: file.name, error: `${message} The file was kept for review; fix the data and upload again to retry.` };
  }

  revalidatePath("/dashboard");
  revalidatePath("/documents");
  revalidatePath("/invoices");
  revalidatePath("/contracts");
  revalidatePath("/vendors");
  revalidatePath("/opportunities");
  revalidatePath("/recoveries");
  return result;
}

async function vendorIdFor(workspace: LiveWorkspace, name: string) {
  return (await ensureVendor(workspace, name)).id;
}

async function persistInvoice(workspace: LiveWorkspace, documentId: string, invoice: ParsedInvoice) {
  const { supabase, organization } = workspace;
  const vendor = await ensureVendor(workspace, invoice.vendorName);

  const { data: created, error } = await supabase
    .from("invoices")
    .insert({
      organization_id: organization.id,
      vendor_id: vendor.id,
      source_document_id: documentId,
      invoice_number: invoice.invoiceNumber,
      invoice_date: invoice.invoiceDate,
      currency: invoice.currency,
      total: invoice.total,
      status: "ingested",
    })
    .select("id").single();
  if (error || !created) throw new Error(`Could not save invoice ${invoice.invoiceNumber}: ${error?.message ?? "unknown"}`);
  const invoiceId = (created as { id: string }).id;

  const lineRows = invoice.lines.map((line) => ({
    organization_id: organization.id,
    invoice_id: invoiceId,
    external_line_id: line.externalLineId,
    line_number: line.lineNumber,
    description: line.description,
    quantity: line.quantity,
    unit: line.unit,
    unit_price: line.unitPrice,
    billed_amount: line.billedAmount,
    charge_code: line.chargeCode,
    dimensions: line.dimensions,
    source_locator: { documentId, locator: line.locator },
  }));
  for (let index = 0; index < lineRows.length; index += 500) {
    const { error: lineError } = await supabase.from("invoice_lines").insert(lineRows.slice(index, index + 500));
    if (lineError) throw new Error(`Could not save invoice lines: ${lineError.message}`);
  }

  await writeAuditLog(workspace, "invoice.ingested", { type: "invoice", id: invoiceId }, { invoiceNumber: invoice.invoiceNumber, vendor: vendor.name, lines: invoice.lines.length, total: invoice.total, documentId });
  const audit = await auditInvoice(workspace, invoiceId);
  return { invoiceId, invoiceNumber: invoice.invoiceNumber, vendor: vendor.name, total: invoice.total, lines: invoice.lines.length, audit };
}

async function persistRateSheet(workspace: LiveWorkspace, documentId: string, sheet: ParsedRateSheet) {
  const { supabase, organization } = workspace;
  const vendor = await ensureVendor(workspace, sheet.vendorName);

  // A re-uploaded rate sheet supersedes the previous version with the same title so audits stay deterministic.
  await supabase.from("contracts").update({ status: "superseded" })
    .eq("vendor_id", vendor.id).eq("title", sheet.contractTitle).eq("status", "active");

  const { data: created, error } = await supabase
    .from("contracts")
    .insert({
      organization_id: organization.id,
      vendor_id: vendor.id,
      source_document_id: documentId,
      title: sheet.contractTitle,
      effective_from: sheet.effectiveFrom,
      effective_to: sheet.effectiveTo,
      currency: sheet.currency,
      status: "active",
    })
    .select("id").single();
  if (error || !created) throw new Error(`Could not save contract ${sheet.contractTitle}: ${error?.message ?? "unknown"}`);
  const contractId = (created as { id: string }).id;

  const termRows = sheet.terms.map((term) => ({
    organization_id: organization.id,
    contract_id: contractId,
    term_type: term.termType,
    normalized_key: `${termKey(term.chargeCode, term.dimensions)}|${term.termType}`,
    value: { ...term.value, chargeCode: term.chargeCode, dimensions: term.dimensions },
    source_locator: { documentId, locator: term.locator, label: `${sheet.contractTitle} · ${term.locator}` },
    confidence: "1.0000",
  }));
  for (let index = 0; index < termRows.length; index += 500) {
    const { error: termError } = await supabase.from("contract_terms").insert(termRows.slice(index, index + 500));
    if (termError) throw new Error(`Could not save contract terms: ${termError.message}`);
  }

  await writeAuditLog(workspace, "contract.ingested", { type: "contract", id: contractId }, { title: sheet.contractTitle, vendor: vendor.name, terms: sheet.terms.length, documentId });
  return { contractId, title: sheet.contractTitle, vendor: vendor.name, terms: sheet.terms.length };
}

export async function reauditInvoiceAction(formData: FormData): Promise<void> {
  const workspace = await requireLiveWorkspace(WRITER_ROLES);
  const invoiceId = String(formData.get("invoice_id") ?? "");
  if (!invoiceId) return;
  await auditInvoice(workspace, invoiceId);
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/opportunities");
  revalidatePath("/dashboard");
}
