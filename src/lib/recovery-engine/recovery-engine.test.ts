import { describe, expect, it } from "vitest";
import { logisticsRateVarianceRule, runRecoveryEngine } from ".";

const candidate = {
  organizationId: "org-demo",
  chargeId: "line-42",
  module: "logistics",
  vendorId: "vendor-northstar",
  currency: "USD",
  billedAmount: "11680.00",
  quantity: "1000",
  contractedUnitRate: "4.15",
  evidence: [
    { documentId: "invoice-1", kind: "invoice" as const, locator: "page:4", label: "Invoice lines" },
    { documentId: "contract-1", kind: "contract" as const, locator: "section:4.2", label: "Rate clause" },
  ],
};

describe("recovery engine", () => {
  it("produces an exact deterministic rate variance", () => {
    const result = runRecoveryEngine(candidate, [logisticsRateVarianceRule]);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({
      expectedValue: "4150",
      actualValue: "11680.00",
      variance: "7530",
      recoverableAmount: "7530",
      confidence: "0.98",
      severity: "high",
    });
    expect(result.findings[0].calculationTrace.ruleVersion).toBe("logistics.rate-variance@1.0.0");
  });

  it("does not create a finding when billed value is contract-correct", () => {
    const result = runRecoveryEngine({ ...candidate, billedAmount: "4150" }, [logisticsRateVarianceRule]);
    expect(result.findings).toHaveLength(0);
  });

  it("keeps incomplete evidence in human review", () => {
    const result = runRecoveryEngine({ ...candidate, evidence: candidate.evidence.slice(0, 1) }, [logisticsRateVarianceRule]);
    expect(result.findings[0]).toMatchObject({ status: "needs_review", confidence: "0.72" });
  });

  it("rejects floating-point and exponent notation", () => {
    expect(() => runRecoveryEngine({ ...candidate, billedAmount: "1e5" }, [logisticsRateVarianceRule])).toThrow("Invalid decimal value");
  });
});
