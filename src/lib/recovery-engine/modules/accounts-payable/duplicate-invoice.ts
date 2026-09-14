import { compareDecimal, isPositive } from "../../core/money";
import { severityForVariance } from "../../core/severity";
import type { EvidenceReference, InvoiceRule } from "../../core/types";

/** Another invoice from the same vendor already carries this invoice number. */
export const duplicateInvoiceRule: InvoiceRule = {
  id: "accounts_payable.duplicate-invoice",
  module: "accounts_payable",
  version: "1.0.0",
  scope: "invoice",
  evaluate(context) {
    if (!context.invoiceNumber || !isPositive(context.invoiceTotal)) return [];
    const wanted = context.invoiceNumber.trim().toUpperCase();
    const matches = context.priorInvoices.filter((prior) =>
      prior.invoiceId !== context.invoiceId && (prior.invoiceNumber ?? "").trim().toUpperCase() === wanted,
    );
    if (matches.length === 0) return [];

    const exact = matches.filter((prior) => compareDecimal(prior.total, context.invoiceTotal) === 0);
    const recoverable = exact.length > 0;
    const evidence: EvidenceReference[] = [
      ...(context.invoiceDocumentId ? [{ documentId: context.invoiceDocumentId, kind: "invoice" as const, locator: "invoice:header", label: `Invoice ${context.invoiceNumber}` }] : []),
      ...matches.flatMap((prior) => prior.documentId ? [{ documentId: prior.documentId, kind: "invoice" as const, locator: "invoice:header", label: `Earlier invoice ${prior.invoiceNumber ?? ""}${prior.invoiceDate ? ` (${prior.invoiceDate})` : ""}` }] : []),
    ];

    return [{
      ruleId: this.id,
      ruleVersion: this.version,
      module: this.module,
      findingType: "duplicate_invoice",
      title: `Invoice ${context.invoiceNumber} was already received`,
      dedupeKey: `${this.id}:${context.invoiceId}`,
      chargeId: null,
      invoiceId: context.invoiceId,
      contractId: null,
      expectedValue: recoverable ? "0" : null,
      actualValue: context.invoiceTotal,
      variance: context.invoiceTotal,
      recoverableAmount: context.invoiceTotal,
      currency: context.currency,
      confidence: recoverable ? "0.97" : "0.65",
      severity: severityForVariance(context.invoiceTotal),
      recoverability: recoverable ? "recoverable" : "needs_review",
      evidenceReferences: evidence,
      explanation: recoverable
        ? `${exact.length} earlier invoice${exact.length === 1 ? "" : "s"} from this vendor carry number ${context.invoiceNumber} with the identical total ${context.invoiceTotal} ${context.currency}. Pay only once.`
        : `Invoice number ${context.invoiceNumber} already exists for this vendor with a different total. Confirm whether this is a re-issue or a duplicate before paying.`,
      calculationTrace: {
        formula: "same vendor + same invoice_number already ingested → expected 0 when totals match; variance = invoice total",
        operands: { invoiceNumber: context.invoiceNumber, priorMatches: String(matches.length), exactTotalMatches: String(exact.length) },
        expectedAmount: recoverable ? "0" : null,
        billedAmount: context.invoiceTotal,
        varianceAmount: context.invoiceTotal,
        ruleVersion: `${this.id}@${this.version}`,
      },
    }];
  },
};
