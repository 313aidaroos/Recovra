import { matchTerm, termKey } from "../../core/matching";
import { isPositive, maxDecimal, multiplyDecimal, subtractDecimal } from "../../core/money";
import { severityForVariance } from "../../core/severity";
import type { LineRule } from "../../core/types";

/**
 * Contracted rate × actual quantity versus billed amount.
 * Covers parcel, LTL/FTL trucking (per mile / per cwt / flat), drayage and ocean lane rates
 * (transatlantic / transpacific per-container rates keyed by origin, destination and equipment).
 */
export const logisticsRateVarianceRule: LineRule = {
  id: "logistics.rate-variance",
  module: "logistics",
  version: "2.0.0",
  scope: "line",
  evaluate(line, context) {
    const term = matchTerm(context.terms, line, ["rate"]);
    if (!term || !term.value.rate) return null;

    const basis = term.value.basis ?? "per_unit";
    const quantity = line.quantity ?? "1";
    let expected = basis === "flat" ? term.value.rate : multiplyDecimal(quantity, term.value.rate);
    if (term.value.minimum) expected = maxDecimal(expected, term.value.minimum);

    const variance = subtractDecimal(line.billedAmount, expected);
    if (!isPositive(variance)) return null;

    const evidence = [...line.evidence, ...(term.evidence ? [term.evidence] : [])];
    const strong = line.evidence.length > 0 && term.evidence !== null;

    return {
      ruleId: this.id,
      ruleVersion: this.version,
      module: this.module,
      findingType: "contract_rate_variance",
      title: `${line.chargeCode} billed above contracted rate`,
      dedupeKey: `${this.id}:${line.chargeId}`,
      chargeId: line.chargeId,
      invoiceId: line.invoiceId,
      contractId: term.contractId,
      expectedValue: expected,
      actualValue: line.billedAmount,
      variance,
      recoverableAmount: variance,
      currency: line.currency,
      confidence: strong ? "0.98" : "0.80",
      severity: severityForVariance(variance),
      recoverability: strong ? "recoverable" : "needs_review",
      evidenceReferences: evidence,
      explanation:
        basis === "flat"
          ? `The contract sets a flat ${term.value.rate} ${line.currency} for ${line.chargeCode}; the invoice billed ${line.billedAmount}.`
          : `${quantity} ${line.unit ?? term.value.unit ?? "units"} × contracted ${term.value.rate} ${line.currency} = ${expected}; the invoice billed ${line.billedAmount}.`,
      calculationTrace: {
        formula: basis === "flat"
          ? "expected = max(contracted_flat_rate, minimum); variance = billed − expected"
          : "expected = max(quantity × contracted_unit_rate, minimum); variance = billed − expected",
        operands: {
          quantity,
          contractedRate: term.value.rate,
          basis,
          minimum: term.value.minimum ?? "0",
        },
        expectedAmount: expected,
        billedAmount: line.billedAmount,
        varianceAmount: variance,
        ruleVersion: `${this.id}@${this.version}`,
        matchedTerm: { termId: term.termId, contractId: term.contractId, key: termKey(term.chargeCode, term.dimensions) },
      },
    };
  },
};
