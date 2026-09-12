import { matchTerm, normalizeCode, termKey } from "../../core/matching";
import { isPositive, percentOf, subtractDecimal, sumDecimals } from "../../core/money";
import { severityForVariance } from "../../core/severity";
import type { LineRule } from "../../core/types";

export const FUEL_CODES = new Set(["FSC", "FUEL", "FUEL_SURCHARGE", "BAF", "BUNKER"]);
export const DEFAULT_BASIS_CODES = ["LINEHAUL", "LH", "FREIGHT", "FRT", "BASE", "BASE_RATE", "OCEAN_FREIGHT", "OFR"];

/**
 * Fuel / bunker surcharge billed as a percentage of the base freight for the same shipment reference.
 */
export const logisticsFuelSurchargeRule: LineRule = {
  id: "logistics.fuel-surcharge-variance",
  module: "logistics",
  version: "1.0.0",
  scope: "line",
  evaluate(line, context) {
    if (!FUEL_CODES.has(normalizeCode(line.chargeCode))) return null;
    const term = matchTerm(context.terms, line, ["percent"]);
    if (!term || !term.value.percent) return null;

    const basisCodes = new Set((term.value.percentBasisCodes ?? DEFAULT_BASIS_CODES).map(normalizeCode));
    const reference = line.dimensions.reference;
    const baseLines = context.lines.filter((candidate) =>
      candidate.invoiceId === line.invoiceId
      && basisCodes.has(normalizeCode(candidate.chargeCode))
      && (!reference || candidate.dimensions.reference === reference),
    );
    if (baseLines.length === 0) return null;

    const base = sumDecimals(baseLines.map((candidate) => candidate.billedAmount));
    const expected = percentOf(base, term.value.percent);
    const variance = subtractDecimal(line.billedAmount, expected);
    if (!isPositive(variance)) return null;

    const evidence = [
      ...line.evidence,
      ...baseLines.flatMap((candidate) => candidate.evidence),
      ...(term.evidence ? [term.evidence] : []),
    ];

    return {
      ruleId: this.id,
      ruleVersion: this.version,
      module: this.module,
      findingType: "fuel_surcharge_variance",
      title: "Fuel surcharge above contracted percentage",
      dedupeKey: `${this.id}:${line.chargeId}`,
      chargeId: line.chargeId,
      invoiceId: line.invoiceId,
      contractId: term.contractId,
      expectedValue: expected,
      actualValue: line.billedAmount,
      variance,
      recoverableAmount: variance,
      currency: line.currency,
      confidence: term.evidence ? "0.96" : "0.80",
      severity: severityForVariance(variance),
      recoverability: term.evidence ? "recoverable" : "needs_review",
      evidenceReferences: evidence,
      explanation: `Contracted fuel surcharge is ${term.value.percent}% of ${base} ${line.currency} base freight (${baseLines.length} line${baseLines.length === 1 ? "" : "s"}${reference ? ` on ${reference}` : ""}) = ${expected}; the invoice billed ${line.billedAmount}.`,
      calculationTrace: {
        formula: "expected = base_freight × contracted_percent ÷ 100; variance = billed − expected",
        operands: { baseFreight: base, contractedPercent: term.value.percent, baseLineCount: String(baseLines.length) },
        expectedAmount: expected,
        billedAmount: line.billedAmount,
        varianceAmount: variance,
        ruleVersion: `${this.id}@${this.version}`,
        matchedTerm: { termId: term.termId, contractId: term.contractId, key: termKey(term.chargeCode, term.dimensions) },
      },
    };
  },
};
