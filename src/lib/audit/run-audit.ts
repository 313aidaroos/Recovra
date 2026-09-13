import type { LiveWorkspace } from "@/lib/auth/workspace";
import { writeAuditLog } from "@/lib/auth/workspace";
import type { ContractRow, ContractTermRow, FindingRow, InvoiceLineRow, InvoiceRow, ModuleConfigRow } from "@/lib/db/types";
import {
  allRecoveryRules,
  decimalText,
  RULESET_VERSION,
  runRecoveryEngine,
  sumDecimals,
  type AuditContext,
  type ChargeLine,
  type ContractTerm,
  type ContractTermType,
  type ContractTermValue,
  type EvidenceReference,
  type PriorInvoice,
  type RuleFinding,
} from "@/lib/recovery-engine";
import { applySourceExtractionLimits, type SourceExtraction } from "./source-extraction";

export type AuditSummary = {
  auditRunId: string;
  invoiceId: string;
  findings: number;
  recoverable: number;
  needsReview: number;
  totalVariance: string;
  rulesEvaluated: string[];
};

function termFromRow(row: ContractTermRow, contract: ContractRow): ContractTerm {
  const value = row.value as ContractTermValue & { chargeCode?: string; dimensions?: Record<string, string> };
  const locator = row.source_locator as { documentId?: string; locator?: string; label?: string };
  return {
    termId: row.id,
    contractId: row.contract_id,
    contractTitle: contract.title,
    termType: row.term_type as ContractTermType,
    chargeCode: value.chargeCode ?? row.normalized_key.split("|")[0],
    dimensions: value.dimensions ?? {},
    value,
    evidence: locator.documentId
      ? { documentId: locator.documentId, kind: "rate_sheet", locator: locator.locator ?? "row:?", label: locator.label ?? contract.title }
      : null,
  };
}

async function loadSourceExtraction(workspace: LiveWorkspace, invoice: InvoiceRow): Promise<SourceExtraction | null> {
  if (!invoice.source_document_id) return null;
  const { data } = await workspace.supabase.from("documents").select("metadata").eq("id", invoice.source_document_id).maybeSingle();
  const extraction = (data as { metadata?: { extraction?: Partial<SourceExtraction> } } | null)?.metadata?.extraction;
  if (!extraction || extraction.method !== "ai") return null;
  return { method: "ai", provider: String(extraction.provider ?? "unknown"), model: String(extraction.model ?? "unknown"), confidence: String(extraction.confidence ?? "0.5"), extractedAt: String(extraction.extractedAt ?? "") };
}

/**
 * Runs every active rule pack against one invoice and persists the outcome:
 * audit_runs → findings (upserted by dedupe key) → finding_evidence → recoveries (detected).
 * Deterministic and idempotent: re-running on the same data changes nothing.
 */
export async function auditInvoice(workspace: LiveWorkspace, invoiceId: string): Promise<AuditSummary> {
  const { supabase, organization } = workspace;

  const { data: invoiceData, error: invoiceError } = await supabase
    .from("invoices").select("*").eq("id", invoiceId).eq("organization_id", organization.id).single();
  if (invoiceError || !invoiceData) throw new Error("Invoice not found in this organization.");
  const invoice = invoiceData as InvoiceRow;

  const [{ data: lineRows }, { data: contractRows }, { data: priorRows }, { data: moduleRows }] = await Promise.all([
    supabase.from("invoice_lines").select("*").eq("invoice_id", invoice.id).order("line_number", { ascending: true }),
    supabase.from("contracts").select("*").eq("vendor_id", invoice.vendor_id).eq("status", "active"),
    supabase.from("invoices").select("id, invoice_number, total, invoice_date, source_document_id").eq("vendor_id", invoice.vendor_id).neq("id", invoice.id),
    supabase.from("module_configs").select("module, status, activated_at").eq("organization_id", organization.id).eq("status", "active"),
  ]);

  const contracts = (contractRows ?? []) as ContractRow[];
  const contractIds = contracts.map((contract) => contract.id);
  const { data: termRows } = contractIds.length > 0
    ? await supabase.from("contract_terms").select("*").in("contract_id", contractIds)
    : { data: [] as ContractTermRow[] };

  const contractsById = new Map(contracts.map((contract) => [contract.id, contract]));
  const terms: ContractTerm[] = ((termRows ?? []) as ContractTermRow[])
    .map((row) => {
      const contract = contractsById.get(row.contract_id);
      return contract ? termFromRow(row, contract) : null;
    })
    .filter((term): term is ContractTerm => term !== null);

  const lines: ChargeLine[] = ((lineRows ?? []) as InvoiceLineRow[]).map((row, index) => {
    const evidence: EvidenceReference[] = invoice.source_document_id
      ? [{ documentId: invoice.source_document_id, kind: "invoice", locator: String(row.source_locator.locator ?? `line:${row.line_number ?? index + 1}`), label: `Invoice ${invoice.invoice_number ?? ""} line ${row.line_number ?? index + 1}`.trim() }]
      : [];
    return {
      chargeId: row.id,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      lineNumber: row.line_number ?? index + 1,
      vendorId: invoice.vendor_id,
      currency: invoice.currency,
      chargeCode: row.charge_code ?? "UNSPECIFIED",
      description: row.description ?? "",
      quantity: decimalText(row.quantity),
      unit: row.unit,
      unitPrice: decimalText(row.unit_price),
      billedAmount: decimalText(row.billed_amount) ?? "0",
      dimensions: row.dimensions ?? {},
      evidence,
    };
  });

  const priorInvoices: PriorInvoice[] = ((priorRows ?? []) as Array<Pick<InvoiceRow, "id" | "invoice_number" | "total" | "invoice_date" | "source_document_id">>)
    .map((row) => ({ invoiceId: row.id, invoiceNumber: row.invoice_number, total: decimalText(row.total) ?? "0", invoiceDate: row.invoice_date, documentId: row.source_document_id }));

  const activeModules = ((moduleRows ?? []) as ModuleConfigRow[]).map((row) => row.module);

  const context: AuditContext = {
    organizationId: organization.id,
    vendorId: invoice.vendor_id,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoice_number,
    invoiceTotal: decimalText(invoice.total) ?? "0",
    invoiceDocumentId: invoice.source_document_id,
    currency: invoice.currency,
    activeModules,
    lines,
    terms,
    priorInvoices,
  };

  const startedAt = new Date().toISOString();
  const { data: runRow, error: runError } = await supabase
    .from("audit_runs")
    .insert({ organization_id: organization.id, module: activeModules.join(","), status: "running", ruleset_version: RULESET_VERSION, started_at: startedAt })
    .select("id").single();
  if (runError || !runRow) throw new Error(`Could not create audit run: ${runError?.message ?? "unknown"}`);
  const auditRunId = (runRow as { id: string }).id;

  const engineResult = runRecoveryEngine(context, allRecoveryRules);
  const result = { ...engineResult, findings: applySourceExtractionLimits(engineResult.findings, await loadSourceExtraction(workspace, invoice)) };
  await persistFindings(workspace, auditRunId, invoice, result.findings);

  const totalVariance = sumDecimals(result.findings.map((finding) => finding.variance));
  await supabase.from("audit_runs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", auditRunId);
  await supabase.from("invoices").update({ status: result.findings.length > 0 ? "findings" : "clean" }).eq("id", invoice.id);
  await writeAuditLog(workspace, "audit.completed", { type: "invoice", id: invoice.id }, {
    auditRunId,
    findings: result.findings.length,
    rulesEvaluated: result.rulesEvaluated,
    contractTerms: terms.length,
  });

  return {
    auditRunId,
    invoiceId: invoice.id,
    findings: result.findings.length,
    recoverable: result.findings.filter((finding) => finding.recoverability === "recoverable").length,
    needsReview: result.findings.filter((finding) => finding.recoverability === "needs_review").length,
    totalVariance,
    rulesEvaluated: result.rulesEvaluated,
  };
}

async function persistFindings(workspace: LiveWorkspace, auditRunId: string, invoice: InvoiceRow, findings: RuleFinding[]) {
  const { supabase, organization } = workspace;
  if (findings.length === 0) return [];

  const rows = findings.map((finding) => ({
    organization_id: organization.id,
    audit_run_id: auditRunId,
    vendor_id: invoice.vendor_id,
    invoice_id: invoice.id,
    invoice_line_id: finding.chargeId,
    contract_id: finding.contractId,
    module: finding.module,
    category: finding.findingType,
    title: finding.title,
    description: finding.explanation,
    currency: finding.currency,
    billed_amount: finding.actualValue,
    expected_amount: finding.expectedValue,
    variance_amount: finding.variance,
    confidence: finding.confidence,
    severity: finding.severity,
    recoverability: finding.recoverability,
    rule_version: finding.calculationTrace.ruleVersion,
    calculation_trace: finding.calculationTrace,
    evidence: finding.evidenceReferences,
    dedupe_key: finding.dedupeKey,
  }));

  const { data: saved, error } = await supabase
    .from("findings")
    .upsert(rows, { onConflict: "organization_id,dedupe_key", ignoreDuplicates: false })
    .select("id, dedupe_key");
  if (error) throw new Error(`Could not save findings: ${error.message}`);
  const savedRows = (saved ?? []) as Array<Pick<FindingRow, "id" | "dedupe_key">>;
  const idByKey = new Map(savedRows.map((row) => [row.dedupe_key, row.id]));
  const findingIds = savedRows.map((row) => row.id);

  await supabase.from("finding_evidence").delete().in("finding_id", findingIds);
  const evidenceRows = findings.flatMap((finding) => {
    const findingId = idByKey.get(finding.dedupeKey);
    if (!findingId) return [];
    const unique = new Map(finding.evidenceReferences.map((reference) => [`${reference.documentId}|${reference.locator}`, reference]));
    return [...unique.values()].map((reference) => ({
      organization_id: organization.id,
      finding_id: findingId,
      document_id: reference.documentId,
      evidence_type: reference.kind,
      source_locator: { locator: reference.locator, label: reference.label },
    }));
  });
  if (evidenceRows.length > 0) {
    const { error: evidenceError } = await supabase.from("finding_evidence").insert(evidenceRows);
    if (evidenceError) throw new Error(`Could not save evidence: ${evidenceError.message}`);
  }

  const { data: existingRecoveries } = await supabase.from("recoveries").select("finding_id").in("finding_id", findingIds);
  const covered = new Set(((existingRecoveries ?? []) as Array<{ finding_id: string }>).map((row) => row.finding_id));
  const recoveryRows = findings
    .map((finding) => ({ finding, id: idByKey.get(finding.dedupeKey) }))
    .filter((entry): entry is { finding: RuleFinding; id: string } => Boolean(entry.id) && !covered.has(entry.id as string))
    .map(({ finding, id }) => ({
      organization_id: organization.id,
      finding_id: id,
      status: "detected",
      claimed_amount: finding.recoverableAmount,
      currency: finding.currency,
    }));
  if (recoveryRows.length > 0) {
    const { data: created, error: recoveryError } = await supabase.from("recoveries").insert(recoveryRows).select("id, finding_id");
    if (recoveryError) throw new Error(`Could not open recovery cases: ${recoveryError.message}`);
    const events = ((created ?? []) as Array<{ id: string; finding_id: string }>).map((row) => ({
      organization_id: organization.id,
      recovery_id: row.id,
      event_type: "detected",
      actor_user_id: workspace.user.id,
      details: { auditRunId, source: "recovery-engine" },
    }));
    if (events.length > 0) await supabase.from("recovery_events").insert(events);
  }

  return findingIds;
}
