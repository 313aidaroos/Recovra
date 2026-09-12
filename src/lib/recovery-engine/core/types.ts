export type EvidenceReference = {
  documentId: string;
  kind: "invoice" | "contract" | "operational_event";
  locator: string;
  label: string;
};

export type ChargeCandidate = {
  organizationId: string;
  chargeId: string;
  module: string;
  vendorId: string;
  currency: string;
  billedAmount: string;
  quantity: string;
  contractedUnitRate: string;
  evidence: EvidenceReference[];
};

export type CalculationTrace = {
  formula: string;
  operands: Record<string, string>;
  expectedAmount: string;
  billedAmount: string;
  varianceAmount: string;
  ruleVersion: string;
};

export type RuleFinding = {
  ruleId: string;
  findingType: string;
  chargeId: string;
  expectedValue: string;
  actualValue: string;
  variance: string;
  recoverableAmount: string;
  currency: string;
  confidence: string;
  severity: "low" | "medium" | "high" | "critical";
  evidenceReferences: EvidenceReference[];
  explanation: string;
  status: "detected" | "needs_review";
  calculationTrace: CalculationTrace;
};

export interface RecoveryRule {
  id: string;
  module: string;
  version: string;
  evaluate(candidate: ChargeCandidate): RuleFinding | null;
}
