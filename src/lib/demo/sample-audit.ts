import { parseInvoiceTables, type ParsedInvoice } from "@/lib/ingestion/invoice-parser";
import { parseRateSheetTables, type ParsedRateSheet } from "@/lib/ingestion/rate-sheet-parser";
import { parseCsvText, parseTabularFile, type TabularTable } from "@/lib/ingestion/tabular";
import {
  allRecoveryRules,
  runRecoveryEngine,
  sumDecimals,
  type ChargeLine,
  type ContractTerm,
  type PriorInvoice,
  type RuleFinding,
} from "@/lib/recovery-engine";

export const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";
export const SAMPLE_INVOICE_DOCUMENT_ID = "sample-invoice-template";
export const SAMPLE_RATE_SHEET_DOCUMENT_ID = "sample-rate-sheet-template";

const ACTIVE_MODULES = ["logistics", "accounts_payable"];

export type SampleAuditInvoiceResult = {
  invoiceId: string;
  invoiceNumber: string;
  vendor: string;
  currency: string;
  billedTotal: string;
  lineCount: number;
  findings: RuleFinding[];
  rulesEvaluated: string[];
};

export type SampleAuditResult = {
  demo: true;
  claimsSent: false;
  source: "sample-templates" | "upload";
  message: string;
  invoices: SampleAuditInvoiceResult[];
  warnings: string[];
  rowsRead: { invoices: number; rateSheet: number };
  totals: {
    billed: string;
    variance: string;
    findings: number;
    recoverable: number;
    needsReview: number;
  };
};

function slug(value: string, fallback: string) {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned.slice(0, 64) || fallback;
}

function vendorKey(name: string) {
  return name.trim().toLowerCase();
}

function toChargeLines(invoice: ParsedInvoice, invoiceId: string, vendorId: string, documentId: string): ChargeLine[] {
  return invoice.lines.map((line) => ({
    chargeId: `${invoiceId}:line:${line.lineNumber}`,
    invoiceId,
    invoiceNumber: invoice.invoiceNumber,
    lineNumber: line.lineNumber,
    vendorId,
    currency: invoice.currency,
    chargeCode: line.chargeCode,
    description: line.description,
    quantity: line.quantity,
    unit: line.unit,
    unitPrice: line.unitPrice,
    billedAmount: line.billedAmount,
    dimensions: line.dimensions,
    evidence: [{
      documentId,
      kind: "invoice",
      locator: line.locator,
      label: `Invoice ${invoice.invoiceNumber} line ${line.lineNumber} · ${line.chargeCode}`,
    }],
  }));
}

function toTerms(sheet: ParsedRateSheet, documentId: string): ContractTerm[] {
  const contractId = slug(sheet.contractTitle, "sample-contract");
  return sheet.terms.map((term, index) => ({
    termId: `${contractId}:term:${index + 1}`,
    contractId,
    contractTitle: sheet.contractTitle,
    termType: term.termType,
    chargeCode: term.chargeCode,
    dimensions: term.dimensions,
    value: term.value,
    evidence: {
      documentId,
      kind: "rate_sheet",
      locator: term.locator,
      label: `${sheet.contractTitle} · ${term.locator}`,
    },
  }));
}

export function runSampleAudit(input: {
  invoiceTables: TabularTable[];
  rateSheetTables?: TabularTable[];
  invoiceDocumentId?: string;
  rateSheetDocumentId?: string;
  source?: "sample-templates" | "upload";
  invoiceFilename?: string;
  rateSheetFilename?: string;
}): SampleAuditResult {
  const invoiceDocumentId = input.invoiceDocumentId ?? "upload-invoice";
  const rateSheetDocumentId = input.rateSheetDocumentId ?? "upload-rate-sheet";
  const fallbackInvoiceNumber = (input.invoiceFilename ?? "uploaded-invoice").replace(/\.[^.]+$/, "");

  const parsedInvoices = parseInvoiceTables(input.invoiceTables, { currency: "USD", fallbackInvoiceNumber });
  const parsedRates = input.rateSheetTables && input.rateSheetTables.length > 0
    ? parseRateSheetTables(input.rateSheetTables, { contractTitle: input.rateSheetFilename?.replace(/\.[^.]+$/, "") || "Uploaded rate sheet", currency: "USD" })
    : { sheets: [] as ParsedRateSheet[], warnings: [] as string[], rowsRead: 0 };

  const termsByVendor = new Map<string, ContractTerm[]>();
  for (const sheet of parsedRates.sheets) {
    const key = vendorKey(sheet.vendorName);
    const existing = termsByVendor.get(key) ?? [];
    termsByVendor.set(key, [...existing, ...toTerms(sheet, rateSheetDocumentId)]);
  }

  const warnings = [...parsedInvoices.warnings, ...parsedRates.warnings];
  const invoices: SampleAuditInvoiceResult[] = [];
  const seenByVendor = new Map<string, PriorInvoice[]>();

  for (const invoice of parsedInvoices.invoices) {
    const invoiceId = slug(`${invoice.vendorName}-${invoice.invoiceNumber}`, "sample-invoice");
    const vendorId = slug(invoice.vendorName, "sample-vendor");
    const prior = seenByVendor.get(vendorKey(invoice.vendorName)) ?? [];
    const lines = toChargeLines(invoice, invoiceId, vendorId, invoiceDocumentId);
    const terms = termsByVendor.get(vendorKey(invoice.vendorName)) ?? [];

    const engine = runRecoveryEngine({
      organizationId: DEMO_ORG_ID,
      vendorId,
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      invoiceTotal: invoice.total,
      invoiceDocumentId,
      currency: invoice.currency,
      activeModules: ACTIVE_MODULES,
      lines,
      terms,
      priorInvoices: prior,
    }, allRecoveryRules);

    invoices.push({
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      vendor: invoice.vendorName,
      currency: invoice.currency,
      billedTotal: invoice.total,
      lineCount: invoice.lines.length,
      findings: engine.findings,
      rulesEvaluated: engine.rulesEvaluated,
    });

    seenByVendor.set(vendorKey(invoice.vendorName), [
      ...prior,
      { invoiceId, invoiceNumber: invoice.invoiceNumber, total: invoice.total, invoiceDate: invoice.invoiceDate, documentId: invoiceDocumentId },
    ]);
  }

  if (parsedInvoices.invoices.length === 0) {
    warnings.push("No invoice rows could be read. Use the invoice CSV template (billed_amount + vendor columns).");
  }

  const allFindings = invoices.flatMap((invoice) => invoice.findings);
  const source = input.source ?? "upload";

  return {
    demo: true,
    claimsSent: false,
    source,
    message: source === "sample-templates"
      ? "Demo data. Findings come from the bundled invoice and rate-sheet templates run through the deterministic recovery engine. Nothing was stored and no claim was sent."
      : "Demo run only. Files were audited in memory, not stored. Sign in to persist documents, evidence, and request a recovery after human approval.",
    invoices,
    warnings,
    rowsRead: { invoices: parsedInvoices.rowsRead, rateSheet: parsedRates.rowsRead },
    totals: {
      billed: sumDecimals(invoices.map((invoice) => invoice.billedTotal)),
      variance: sumDecimals(allFindings.map((finding) => finding.variance)),
      findings: allFindings.length,
      recoverable: allFindings.filter((finding) => finding.recoverability === "recoverable").length,
      needsReview: allFindings.filter((finding) => finding.recoverability === "needs_review").length,
    },
  };
}

export async function runSampleAuditFromFiles(invoice: { name: string; buffer: ArrayBuffer }, rateSheet?: { name: string; buffer: ArrayBuffer }): Promise<SampleAuditResult> {
  const invoiceTables = await parseTabularFile(invoice.name, invoice.buffer);
  const rateSheetTables = rateSheet ? await parseTabularFile(rateSheet.name, rateSheet.buffer) : undefined;
  return runSampleAudit({
    invoiceTables,
    rateSheetTables,
    invoiceDocumentId: `upload:${invoice.name}`,
    rateSheetDocumentId: rateSheet ? `upload:${rateSheet.name}` : undefined,
    source: "upload",
    invoiceFilename: invoice.name,
    rateSheetFilename: rateSheet?.name,
  });
}

export function runBundledSampleAudit(invoiceCsv: string, rateSheetCsv: string): SampleAuditResult {
  return runSampleAudit({
    invoiceTables: [parseCsvText(invoiceCsv)],
    rateSheetTables: [parseCsvText(rateSheetCsv)],
    invoiceDocumentId: SAMPLE_INVOICE_DOCUMENT_ID,
    rateSheetDocumentId: SAMPLE_RATE_SHEET_DOCUMENT_ID,
    source: "sample-templates",
    invoiceFilename: "recovra-invoice-template.csv",
    rateSheetFilename: "recovra-rate-sheet-template.csv",
  });
}
