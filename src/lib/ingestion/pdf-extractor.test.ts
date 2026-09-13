import { describe, expect, it } from "vitest";
import { applySourceExtractionLimits } from "@/lib/audit/source-extraction";
import { logisticsRateVarianceRule, runRecoveryEngine, type AuditContext } from "@/lib/recovery-engine";
import { parseInvoiceTables } from "./invoice-parser";
import { tablesFromModelOutput } from "./pdf-extractor";

const modelOutput = `\`\`\`json
{
  "invoice_number": "OCN-55010", "invoice_date": "2026-08-14", "vendor": "Pacific Line", "currency": "usd",
  "stated_total": "3,177.00", "pages_read": 2, "confidence": 0.86, "notes": ["Page 2 footer partially cut off"],
  "lines": [
    { "description": "Ocean freight CNSHA-USLAX 40HC", "charge_code": "OFR", "quantity": "1", "unit_price": "2650", "billed_amount": "2650.00", "mode": "OCEAN", "origin": "CNSHA", "destination": "USLAX", "equipment": "40HC", "reference": "MSKU1234567", "page": 1 },
    { "description": "Fuel surcharge", "charge_code": "FSC", "billed_amount": "477.00", "reference": "MSKU1234567", "page": 1 },
    { "description": "", "billed_amount": "", "page": 2 }
  ]
}
\`\`\``;

describe("pdf extraction → deterministic parser", () => {
  it("turns model output into parser rows with page locators and header defaults", () => {
    const result = tablesFromModelOutput(modelOutput, { provider: "anthropic", model: "test-model" });
    expect(result.tables).toHaveLength(1);
    expect(result.tables[0].rows).toHaveLength(2);
    expect(result.tables[0].rows[0].locator).toBe("pdf:page:1:line:1");
    expect(result.tables[0].rows[1].values).toMatchObject({ invoice_number: "OCN-55010", vendor: "Pacific Line", currency: "USD", charge_code: "FSC", billed_amount: "477.00" });
    expect(result.provenance).toMatchObject({ method: "ai", provider: "anthropic", model: "test-model", confidence: "0.8600", pagesRead: 2, statedTotal: "3,177.00", extractedLines: 2, humanVerificationRequired: true });
    expect(result.warnings).toEqual(["Extraction note: Page 2 footer partially cut off"]);

    const parsed = parseInvoiceTables(result.tables, { currency: "USD", fallbackInvoiceNumber: "fallback" });
    expect(parsed.invoices).toHaveLength(1);
    expect(parsed.invoices[0].total).toBe("3127");
    expect(parsed.invoices[0].lines[0].dimensions).toMatchObject({ origin: "CNSHA", destination: "USLAX", equipment: "40HC" });
  });

  it("rejects output that is not JSON", () => {
    expect(() => tablesFromModelOutput("I cannot read this document.", { provider: "openai", model: "m" })).toThrow(/did not return JSON/);
  });

  it("caps confidence and forces needs_review on findings from AI-extracted rows", () => {
    const context: AuditContext = {
      organizationId: "org", vendorId: "v", invoiceId: "inv", invoiceNumber: "OCN-55010", invoiceTotal: "2650", invoiceDocumentId: "doc", currency: "USD",
      activeModules: ["logistics"], priorInvoices: [],
      lines: [{ chargeId: "l1", invoiceId: "inv", invoiceNumber: "OCN-55010", lineNumber: 1, vendorId: "v", currency: "USD", chargeCode: "OFR", description: "", quantity: "1", unit: null, unitPrice: "2650", billedAmount: "2650", dimensions: {}, evidence: [{ documentId: "doc", kind: "invoice", locator: "pdf:page:1:line:1", label: "Invoice line" }] }],
      terms: [{ termId: "t", contractId: "c", contractTitle: "Rates", termType: "rate", chargeCode: "OFR", dimensions: {}, value: { rate: "2400" }, evidence: { documentId: "rates", kind: "rate_sheet", locator: "row:2", label: "Rates" } }],
    };
    const [finding] = runRecoveryEngine(context, [logisticsRateVarianceRule]).findings;
    expect(finding.recoverability).toBe("recoverable");

    const [limited] = applySourceExtractionLimits([finding], { method: "ai", provider: "anthropic", model: "m", confidence: "0.8600", extractedAt: "2026-09-13T00:00:00Z" });
    expect(limited.variance).toBe(finding.variance);
    expect(limited.recoverability).toBe("needs_review");
    expect(limited.confidence).toBe("0.8600");
    expect(limited.calculationTrace.sourceExtraction).toMatchObject({ method: "ai", humanVerificationRequired: true, confidenceCapApplied: true });
    expect(applySourceExtractionLimits([finding], null)[0]).toBe(finding);
  });
});
