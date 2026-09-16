import { describe, expect, it } from "vitest";
import { demoTemplateContentHash, persistDemoAuditRun } from "./persist-demo-run";
import type { SampleAuditResult } from "./sample-audit";

const base: SampleAuditResult = {
  demo: true,
  claimsSent: false,
  source: "sample-templates",
  message: "Demo data.",
  invoices: [],
  warnings: [],
  rowsRead: { invoices: 0, rateSheet: 0 },
  totals: { billed: "0", variance: "0", findings: 0, recoverable: 0, needsReview: 0 },
};

describe("demo persist guards", () => {
  it("hashes the bundled templates stably", () => {
    expect(demoTemplateContentHash("a", "b")).toBe(demoTemplateContentHash("a", "b"));
    expect(demoTemplateContentHash("a", "b")).not.toBe(demoTemplateContentHash("a", "c"));
    expect(demoTemplateContentHash("a", "b")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("does not store visitor uploads", async () => {
    const result = await persistDemoAuditRun({ ...base, source: "upload" }, "a".repeat(64));
    expect(result).toEqual({
      persisted: false,
      reason: "Visitor uploads are not stored. Only Recovra's labeled sample templates are persisted.",
    });
  });

  it("does not persist a run that sent claims", async () => {
    const result = await persistDemoAuditRun({ ...base, claimsSent: true as unknown as false }, "a".repeat(64));
    expect(result.persisted).toBe(false);
    if (!result.persisted) expect(result.reason).toMatch(/claims/i);
  });
});
