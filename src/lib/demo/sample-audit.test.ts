import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { compareDecimal, isPositive, sumDecimals } from "@/lib/recovery-engine";
import { runBundledSampleAudit } from "./sample-audit";

const invoiceCsv = readFileSync(join(process.cwd(), "public/templates/recovra-invoice-template.csv"), "utf8");
const rateSheetCsv = readFileSync(join(process.cwd(), "public/templates/recovra-rate-sheet-template.csv"), "utf8");

describe("bundled sample audit", () => {
  const result = runBundledSampleAudit(invoiceCsv, rateSheetCsv);

  it("labels the run as demo and never sends a claim", () => {
    expect(result.demo).toBe(true);
    expect(result.claimsSent).toBe(false);
    expect(result.source).toBe("sample-templates");
    expect(result.message).toMatch(/Demo data/i);
  });

  it("parses both sample invoices and produces evidence-backed findings", () => {
    expect(result.invoices.map((invoice) => invoice.invoiceNumber).sort()).toEqual(["INV-100234", "INV-778812"]);
    expect(result.totals.findings).toBeGreaterThan(0);
    expect(result.invoices.every((invoice) => invoice.findings.length > 0)).toBe(true);

    for (const finding of result.invoices.flatMap((invoice) => invoice.findings)) {
      expect(finding.evidenceReferences.length).toBeGreaterThan(0);
      expect(finding.evidenceReferences.every((reference) => reference.locator && reference.documentId)).toBe(true);
      expect(finding.calculationTrace.ruleVersion).toMatch(/@\d+\.\d+\.\d+$/);
      expect(finding.calculationTrace.billedAmount).toBe(finding.actualValue);
      expect(finding.calculationTrace.varianceAmount).toBe(finding.variance);
    }
  });

  it("keeps money as decimal strings that re-sum to the reported totals", () => {
    const findings = result.invoices.flatMap((invoice) => invoice.findings);
    expect(result.totals.billed).toBe(sumDecimals(result.invoices.map((invoice) => invoice.billedTotal)));
    expect(result.totals.variance).toBe(sumDecimals(findings.map((finding) => finding.variance)));
    expect(compareDecimal(result.totals.billed, "0")).toBe(1);
    expect(findings.every((finding) => isPositive(finding.variance) || finding.variance === "0")).toBe(true);
  });

  it("flags the ocean freight overcharge against the contracted 2400 rate", () => {
    const ocean = result.invoices.find((invoice) => invoice.invoiceNumber === "INV-100234");
    const finding = ocean?.findings.find((item) => item.findingType === "contract_rate_variance" && item.title.startsWith("OFR "));
    expect(finding).toBeTruthy();
    expect(finding).toMatchObject({ expectedValue: "2400", actualValue: "2650", variance: "250", recoverability: "recoverable" });
    expect(finding!.evidenceReferences.some((reference) => reference.kind === "invoice")).toBe(true);
    expect(finding!.evidenceReferences.some((reference) => reference.kind === "rate_sheet")).toBe(true);
  });

  it("does not treat unapproved accessorials as verified savings", () => {
    const cleaning = result.invoices
      .flatMap((invoice) => invoice.findings)
      .find((finding) => finding.findingType === "unapproved_charge");
    expect(cleaning).toBeTruthy();
    expect(cleaning!.recoverability).toBe("needs_review");
    expect(cleaning!.expectedValue).toBeNull();
  });
});
