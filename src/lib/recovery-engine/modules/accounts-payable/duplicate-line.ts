import { normalizeCode } from "../../core/matching";
import { isPositive } from "../../core/money";
import { severityForVariance } from "../../core/severity";
import type { ChargeLine, LineRule } from "../../core/types";

function signature(line: ChargeLine) {
  return [normalizeCode(line.chargeCode), line.dimensions.reference ?? "", line.billedAmount, line.quantity ?? ""].join("|");
}

/** The same charge (code + shipment reference + amount) appears more than once on one invoice. */
export const duplicateLineRule: LineRule = {
  id: "accounts_payable.duplicate-line",
  module: "accounts_payable",
  version: "1.0.0",
  scope: "line",
  evaluate(line, context) {
    if (!isPositive(line.billedAmount)) return null;
    const mySignature = signature(line);
    const original = context.lines.find((candidate) =>
      candidate.invoiceId === line.invoiceId
      && candidate.chargeId !== line.chargeId
      && candidate.lineNumber < line.lineNumber
      && signature(candidate) === mySignature,
    );
    if (!original) return null;

    return {
      ruleId: this.id,
      ruleVersion: this.version,
      module: this.module,
      findingType: "duplicate_charge",
      title: `Duplicate ${line.chargeCode} charge on invoice`,
      dedupeKey: `${this.id}:${line.chargeId}`,
      chargeId: line.chargeId,
      invoiceId: line.invoiceId,
      contractId: null,
      expectedValue: "0",
      actualValue: line.billedAmount,
      variance: line.billedAmount,
      recoverableAmount: line.billedAmount,
      currency: line.currency,
      confidence: line.dimensions.reference ? "0.95" : "0.75",
      severity: severityForVariance(line.billedAmount),
      recoverability: line.dimensions.reference ? "recoverable" : "needs_review",
      evidenceReferences: [...original.evidence, ...line.evidence],
      explanation: `Line ${line.lineNumber} repeats line ${original.lineNumber}: ${line.chargeCode}${line.dimensions.reference ? ` on ${line.dimensions.reference}` : ""} for ${line.billedAmount} ${line.currency}. Only one occurrence should be paid.`,
      calculationTrace: {
        formula: "duplicate of an earlier identical line → expected 0; variance = billed",
        operands: { originalLine: String(original.lineNumber), duplicateLine: String(line.lineNumber), signature: mySignature },
        expectedAmount: "0",
        billedAmount: line.billedAmount,
        varianceAmount: line.billedAmount,
        ruleVersion: `${this.id}@${this.version}`,
      },
    };
  },
};
