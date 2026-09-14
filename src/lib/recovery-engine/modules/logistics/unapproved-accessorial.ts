import { hasAnyTermForCode, normalizeCode } from "../../core/matching";
import { isPositive } from "../../core/money";
import { severityForVariance } from "../../core/severity";
import type { LineRule } from "../../core/types";
import { DEFAULT_BASIS_CODES } from "./fuel-surcharge-variance";

const ALWAYS_EXPECTED = new Set(DEFAULT_BASIS_CODES.map(normalizeCode));

/**
 * A charge code that appears on the invoice but nowhere in the vendor's contract terms.
 * Recovra cannot compute an expected amount, so this is flagged for human review — never counted as verified savings.
 */
export const logisticsUnapprovedAccessorialRule: LineRule = {
  id: "logistics.unapproved-accessorial",
  module: "logistics",
  version: "1.0.0",
  scope: "line",
  evaluate(line, context) {
    if (context.terms.length === 0) return null;
    const code = normalizeCode(line.chargeCode);
    if (!code || ALWAYS_EXPECTED.has(code)) return null;
    if (hasAnyTermForCode(context.terms, code)) return null;
    if (!isPositive(line.billedAmount)) return null;

    const contractId = context.terms[0]?.contractId ?? null;
    return {
      ruleId: this.id,
      ruleVersion: this.version,
      module: this.module,
      findingType: "unapproved_charge",
      title: `${line.chargeCode} is not in the contracted charge schedule`,
      dedupeKey: `${this.id}:${line.chargeId}`,
      chargeId: line.chargeId,
      invoiceId: line.invoiceId,
      contractId,
      expectedValue: null,
      actualValue: line.billedAmount,
      variance: line.billedAmount,
      recoverableAmount: line.billedAmount,
      currency: line.currency,
      confidence: "0.60",
      severity: severityForVariance(line.billedAmount),
      recoverability: "needs_review",
      evidenceReferences: line.evidence,
      explanation: `The invoice bills ${line.billedAmount} ${line.currency} for ${line.chargeCode} (${line.description || "no description"}), but none of the ${context.terms.length} loaded contract terms cover that charge code. Confirm whether the accessorial was authorised before disputing.`,
      calculationTrace: {
        formula: "no contracted term for charge_code → expected undefined; variance shown = billed amount pending review",
        operands: { chargeCode: code, contractTermsLoaded: String(context.terms.length) },
        expectedAmount: null,
        billedAmount: line.billedAmount,
        varianceAmount: line.billedAmount,
        ruleVersion: `${this.id}@${this.version}`,
      },
    };
  },
};
