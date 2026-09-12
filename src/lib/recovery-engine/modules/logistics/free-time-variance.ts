import { matchTerm, normalizeCode, termKey } from "../../core/matching";
import { compareDecimal, isPositive, multiplyDecimal, subtractDecimal } from "../../core/money";
import { severityForVariance } from "../../core/severity";
import type { LineRule } from "../../core/types";

export const FREE_TIME_CODES = new Set([
  "DEM", "DEMURRAGE", "DET", "DETENTION", "PER_DIEM", "PERDIEM", "STORAGE", "CHASSIS", "DRIVER_DETENTION", "LAYOVER",
]);

/**
 * Ocean & drayage free-time charges (demurrage, detention, per-diem, chassis, storage).
 * chargeable_days = max(0, actual_days − contracted_free_days); expected = chargeable_days × contracted_daily_rate.
 * Transatlantic and transpacific lanes differ only in the matched term's origin/destination/equipment.
 */
export const logisticsFreeTimeRule: LineRule = {
  id: "logistics.free-time-variance",
  module: "logistics",
  version: "1.0.0",
  scope: "line",
  evaluate(line, context) {
    if (!FREE_TIME_CODES.has(normalizeCode(line.chargeCode))) return null;
    const term = matchTerm(context.terms, line, ["free_time"]);
    if (!term || !term.value.rate) return null;

    const billedDays = line.quantity ?? "0";
    const actualDays = line.dimensions.actual_days ?? billedDays;
    const freeDays = line.dimensions.free_days && compareDecimal(line.dimensions.free_days, term.value.freeDays ?? "0") > 0
      ? line.dimensions.free_days
      : term.value.freeDays ?? "0";

    const rawChargeable = subtractDecimal(actualDays, freeDays);
    const chargeableDays = isPositive(rawChargeable) ? rawChargeable : "0";
    const expected = multiplyDecimal(chargeableDays, term.value.rate);
    const variance = subtractDecimal(line.billedAmount, expected);
    if (!isPositive(variance)) return null;

    const evidence = [...line.evidence, ...(term.evidence ? [term.evidence] : [])];
    const hasActivity = Boolean(line.dimensions.actual_days);

    return {
      ruleId: this.id,
      ruleVersion: this.version,
      module: this.module,
      findingType: "free_time_variance",
      title: `${line.chargeCode} billed beyond contracted free time`,
      dedupeKey: `${this.id}:${line.chargeId}`,
      chargeId: line.chargeId,
      invoiceId: line.invoiceId,
      contractId: term.contractId,
      expectedValue: expected,
      actualValue: line.billedAmount,
      variance,
      recoverableAmount: variance,
      currency: line.currency,
      confidence: hasActivity && term.evidence ? "0.97" : "0.78",
      severity: severityForVariance(variance),
      recoverability: hasActivity && term.evidence ? "recoverable" : "needs_review",
      evidenceReferences: evidence,
      explanation: `${actualDays} actual day(s) − ${freeDays} contracted free day(s) = ${chargeableDays} chargeable day(s) × ${term.value.rate} ${line.currency} = ${expected}; the invoice billed ${line.billedAmount} for ${billedDays} day(s).${hasActivity ? "" : " Actual days were not supplied, so billed days were used; confirm with the terminal/carrier record."}`,
      calculationTrace: {
        formula: "chargeable_days = max(0, actual_days − free_days); expected = chargeable_days × contracted_daily_rate; variance = billed − expected",
        operands: { billedDays, actualDays, freeDays, chargeableDays, contractedDailyRate: term.value.rate },
        expectedAmount: expected,
        billedAmount: line.billedAmount,
        varianceAmount: variance,
        ruleVersion: `${this.id}@${this.version}`,
        matchedTerm: { termId: term.termId, contractId: term.contractId, key: termKey(term.chargeCode, term.dimensions) },
      },
    };
  },
};
