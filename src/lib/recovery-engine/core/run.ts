import type { ChargeCandidate, RecoveryRule, RuleFinding } from "./types";

export type RecoveryEngineResult = {
  organizationId: string;
  chargeId: string;
  findings: RuleFinding[];
  rulesEvaluated: string[];
};

export function runRecoveryEngine(candidate: ChargeCandidate, rules: RecoveryRule[]): RecoveryEngineResult {
  if (!candidate.organizationId) throw new Error("organizationId is required");
  const applicable = rules.filter((rule) => rule.module === candidate.module);
  const findings = applicable
    .map((rule) => rule.evaluate(candidate))
    .filter((finding): finding is RuleFinding => finding !== null);

  return {
    organizationId: candidate.organizationId,
    chargeId: candidate.chargeId,
    findings,
    rulesEvaluated: applicable.map((rule) => `${rule.id}@${rule.version}`),
  };
}
