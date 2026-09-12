import type { AuditContext, RecoveryRule, RuleFinding } from "./types";

export type RecoveryEngineResult = {
  organizationId: string;
  invoiceId: string;
  findings: RuleFinding[];
  rulesEvaluated: string[];
  rulesSkipped: string[];
};

/**
 * Deterministic orchestration: every active rule sees every line and the same context.
 * Rules are pure functions; persistence, AI explanation and workflow live outside the engine.
 */
export function runRecoveryEngine(context: AuditContext, rules: RecoveryRule[]): RecoveryEngineResult {
  if (!context.organizationId) throw new Error("organizationId is required");
  if (!context.invoiceId) throw new Error("invoiceId is required");

  const active = rules.filter((rule) => context.activeModules.includes(rule.module));
  const skipped = rules.filter((rule) => !context.activeModules.includes(rule.module));
  const findings: RuleFinding[] = [];

  for (const rule of active) {
    if (rule.scope === "invoice") {
      findings.push(...rule.evaluate(context));
      continue;
    }
    for (const line of context.lines) {
      const finding = rule.evaluate(line, context);
      if (finding) findings.push(finding);
    }
  }

  const seen = new Set<string>();
  const deduped = findings.filter((finding) => {
    if (seen.has(finding.dedupeKey)) return false;
    seen.add(finding.dedupeKey);
    return true;
  });

  return {
    organizationId: context.organizationId,
    invoiceId: context.invoiceId,
    findings: deduped,
    rulesEvaluated: active.map((rule) => `${rule.id}@${rule.version}`),
    rulesSkipped: skipped.map((rule) => `${rule.id}@${rule.version}`),
  };
}
