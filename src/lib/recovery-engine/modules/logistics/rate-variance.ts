import { isPositive, multiplyDecimal, subtractDecimal } from "../../core/money";
import type { RecoveryRule } from "../../core/types";

export const logisticsRateVarianceRule: RecoveryRule = {
  id: "logistics.rate-variance",
  module: "logistics",
  version: "1.0.0",
  evaluate(candidate) {
    const expectedAmount = multiplyDecimal(candidate.quantity, candidate.contractedUnitRate);
    const variance = subtractDecimal(candidate.billedAmount, expectedAmount);
    if (!isPositive(variance)) return null;

    return {
      ruleId: this.id,
      findingType: "contract_rate_variance",
      chargeId: candidate.chargeId,
      expectedValue: expectedAmount,
      actualValue: candidate.billedAmount,
      variance,
      recoverableAmount: variance,
      currency: candidate.currency,
      confidence: candidate.evidence.length >= 2 ? "0.98" : "0.72",
      severity: isPositive(subtractDecimal(variance, "1000")) ? "high" : "medium",
      evidenceReferences: candidate.evidence,
      explanation: "The billed charge exceeds the deterministic expected cost calculated from contracted unit rate and actual quantity.",
      status: candidate.evidence.length >= 2 ? "detected" : "needs_review",
      calculationTrace: {
        formula: "expected = actual_quantity × contracted_unit_rate; variance = billed − expected",
        operands: {
          actualQuantity: candidate.quantity,
          contractedUnitRate: candidate.contractedUnitRate,
        },
        expectedAmount,
        billedAmount: candidate.billedAmount,
        varianceAmount: variance,
        ruleVersion: `${this.id}@${this.version}`,
      },
    };
  },
};
