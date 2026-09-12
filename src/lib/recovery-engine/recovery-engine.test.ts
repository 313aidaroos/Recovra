import { describe, expect, it } from "vitest";
import {
  allRecoveryRules,
  duplicateInvoiceRule,
  duplicateLineRule,
  logisticsFreeTimeRule,
  logisticsFuelSurchargeRule,
  logisticsRateVarianceRule,
  logisticsUnapprovedAccessorialRule,
  normalizeDecimalInput,
  runRecoveryEngine,
  type AuditContext,
  type ChargeLine,
  type ContractTerm,
} from ".";

const invoiceEvidence = (row: number) => [{ documentId: "doc-invoice", kind: "invoice" as const, locator: `row:${row}`, label: "Invoice line" }];
const rateSheetEvidence = { documentId: "doc-rates", kind: "rate_sheet" as const, locator: "row:3", label: "Rate sheet" };

function line(overrides: Partial<ChargeLine> & Pick<ChargeLine, "chargeId" | "chargeCode" | "billedAmount">): ChargeLine {
  return {
    invoiceId: "inv-1",
    invoiceNumber: "NSP-884103",
    lineNumber: 1,
    vendorId: "vendor-1",
    currency: "USD",
    description: "",
    quantity: null,
    unit: null,
    unitPrice: null,
    dimensions: {},
    evidence: invoiceEvidence(1),
    ...overrides,
  };
}

function term(overrides: Partial<ContractTerm> & Pick<ContractTerm, "termId" | "termType" | "chargeCode" | "value">): ContractTerm {
  return { contractId: "contract-1", contractTitle: "Master Agreement", dimensions: {}, evidence: rateSheetEvidence, ...overrides };
}

function context(lines: ChargeLine[], terms: ContractTerm[], overrides: Partial<AuditContext> = {}): AuditContext {
  return {
    organizationId: "org-1",
    vendorId: "vendor-1",
    invoiceId: "inv-1",
    invoiceNumber: "NSP-884103",
    invoiceTotal: "0",
    invoiceDocumentId: "doc-invoice",
    currency: "USD",
    activeModules: ["logistics", "accounts_payable"],
    lines,
    terms,
    priorInvoices: [],
    ...overrides,
  };
}

describe("rate variance", () => {
  it("produces an exact deterministic variance from quantity × contracted rate", () => {
    const result = runRecoveryEngine(
      context([line({ chargeId: "l1", chargeCode: "RES_SURCHARGE", quantity: "1000", billedAmount: "11680.00" })],
        [term({ termId: "t1", termType: "rate", chargeCode: "RES_SURCHARGE", value: { rate: "4.15" } })]),
      [logisticsRateVarianceRule],
    );
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({ expectedValue: "4150", variance: "7530", recoverableAmount: "7530", confidence: "0.98", severity: "high", recoverability: "recoverable" });
    expect(result.findings[0].calculationTrace.ruleVersion).toBe("logistics.rate-variance@2.0.0");
  });

  it("prefers the most specific lane term (transpacific 40HC over wildcard)", () => {
    const lane = line({ chargeId: "l1", chargeCode: "OCEAN_FREIGHT", quantity: "2", billedAmount: "9000", dimensions: { mode: "OCEAN", origin: "CNSHA", destination: "USLAX", equipment: "40HC" } });
    const terms = [
      term({ termId: "t-generic", termType: "rate", chargeCode: "OCEAN_FREIGHT", value: { rate: "3000" } }),
      term({ termId: "t-lane", termType: "rate", chargeCode: "OCEAN_FREIGHT", dimensions: { mode: "OCEAN", origin: "CNSHA", destination: "USLAX", equipment: "40HC" }, value: { rate: "4100" } }),
      term({ termId: "t-other-lane", termType: "rate", chargeCode: "OCEAN_FREIGHT", dimensions: { origin: "DEHAM", destination: "USNYC" }, value: { rate: "1500" } }),
    ];
    const [finding] = runRecoveryEngine(context([lane], terms), [logisticsRateVarianceRule]).findings;
    expect(finding.expectedValue).toBe("8200");
    expect(finding.variance).toBe("800");
    expect(finding.calculationTrace.matchedTerm?.termId).toBe("t-lane");
  });

  it("does not create a finding when billed value is contract-correct", () => {
    const result = runRecoveryEngine(
      context([line({ chargeId: "l1", chargeCode: "LINEHAUL", quantity: "500", unit: "MILE", billedAmount: "1250" })],
        [term({ termId: "t1", termType: "rate", chargeCode: "LINEHAUL", dimensions: { mode: "FTL" }, value: { rate: "2.50", unit: "MILE" } })]),
      [logisticsRateVarianceRule],
    );
    expect(result.findings).toHaveLength(0);
  });

  it("keeps incomplete evidence in human review", () => {
    const result = runRecoveryEngine(
      context([line({ chargeId: "l1", chargeCode: "RES_SURCHARGE", quantity: "10", billedAmount: "116.80", evidence: [] })],
        [term({ termId: "t1", termType: "rate", chargeCode: "RES_SURCHARGE", value: { rate: "4.15" } })]),
      [logisticsRateVarianceRule],
    );
    expect(result.findings[0]).toMatchObject({ recoverability: "needs_review", confidence: "0.80" });
  });

  it("rejects floating-point and exponent notation", () => {
    expect(() => runRecoveryEngine(
      context([line({ chargeId: "l1", chargeCode: "RES_SURCHARGE", quantity: "10", billedAmount: "1e5" })],
        [term({ termId: "t1", termType: "rate", chargeCode: "RES_SURCHARGE", value: { rate: "4.15" } })]),
      [logisticsRateVarianceRule],
    )).toThrow("Invalid decimal value");
  });
});

describe("fuel surcharge", () => {
  it("computes the contracted percentage of base freight on the same reference", () => {
    const lines = [
      line({ chargeId: "l1", lineNumber: 1, chargeCode: "LINEHAUL", billedAmount: "2000", dimensions: { reference: "BOL-1" } }),
      line({ chargeId: "l2", lineNumber: 2, chargeCode: "LINEHAUL", billedAmount: "1000", dimensions: { reference: "BOL-2" } }),
      line({ chargeId: "l3", lineNumber: 3, chargeCode: "FSC", billedAmount: "500", dimensions: { reference: "BOL-1" } }),
    ];
    const [finding] = runRecoveryEngine(context(lines, [term({ termId: "t1", termType: "percent", chargeCode: "FSC", value: { percent: "18.5" } })]), [logisticsFuelSurchargeRule]).findings;
    expect(finding.expectedValue).toBe("370");
    expect(finding.variance).toBe("130");
  });
});

describe("free time (demurrage / detention / per-diem)", () => {
  it("charges only days beyond contracted free time", () => {
    const dem = line({ chargeId: "l1", chargeCode: "DEMURRAGE", quantity: "9", billedAmount: "1350", dimensions: { mode: "OCEAN", destination: "USNYC", actual_days: "9" } });
    const [finding] = runRecoveryEngine(
      context([dem], [term({ termId: "t1", termType: "free_time", chargeCode: "DEMURRAGE", dimensions: { destination: "USNYC" }, value: { rate: "150", freeDays: "5" } })]),
      [logisticsFreeTimeRule],
    ).findings;
    expect(finding.calculationTrace.operands.chargeableDays).toBe("4");
    expect(finding.expectedValue).toBe("600");
    expect(finding.variance).toBe("750");
    expect(finding.recoverability).toBe("recoverable");
  });

  it("falls back to review when actual days are missing", () => {
    const det = line({ chargeId: "l1", chargeCode: "DETENTION", quantity: "6", billedAmount: "600" });
    const [finding] = runRecoveryEngine(
      context([det], [term({ termId: "t1", termType: "free_time", chargeCode: "DETENTION", value: { rate: "100", freeDays: "2" } })]),
      [logisticsFreeTimeRule],
    ).findings;
    expect(finding.expectedValue).toBe("400");
    expect(finding.recoverability).toBe("needs_review");
  });
});

describe("unapproved accessorial", () => {
  it("flags unknown charge codes for review without inventing an expected amount", () => {
    const [finding] = runRecoveryEngine(
      context([line({ chargeId: "l1", chargeCode: "LIFTGATE", billedAmount: "85" })], [term({ termId: "t1", termType: "rate", chargeCode: "LINEHAUL", value: { rate: "2" } })]),
      [logisticsUnapprovedAccessorialRule],
    ).findings;
    expect(finding).toMatchObject({ expectedValue: null, recoverability: "needs_review", variance: "85" });
  });

  it("stays silent when no contract terms are loaded", () => {
    const result = runRecoveryEngine(context([line({ chargeId: "l1", chargeCode: "LIFTGATE", billedAmount: "85" })], []), [logisticsUnapprovedAccessorialRule]);
    expect(result.findings).toHaveLength(0);
  });
});

describe("accounts payable", () => {
  it("detects duplicate lines on the same invoice", () => {
    const lines = [
      line({ chargeId: "l1", lineNumber: 1, chargeCode: "LINEHAUL", billedAmount: "900", dimensions: { reference: "PRO-77" } }),
      line({ chargeId: "l2", lineNumber: 2, chargeCode: "LINEHAUL", billedAmount: "900", dimensions: { reference: "PRO-77" }, evidence: invoiceEvidence(2) }),
    ];
    const result = runRecoveryEngine(context(lines, []), [duplicateLineRule]);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({ chargeId: "l2", variance: "900", recoverability: "recoverable" });
  });

  it("detects a duplicate invoice number with identical total", () => {
    const result = runRecoveryEngine(
      context([], [], { invoiceTotal: "5400", priorInvoices: [{ invoiceId: "inv-0", invoiceNumber: "nsp-884103", total: "5400", invoiceDate: "2026-08-01", documentId: "doc-old" }] }),
      [duplicateInvoiceRule],
    );
    expect(result.findings[0]).toMatchObject({ variance: "5400", recoverability: "recoverable", confidence: "0.97" });
    expect(result.findings[0].evidenceReferences.map((item) => item.documentId)).toEqual(["doc-invoice", "doc-old"]);
  });

  it("skips rules for modules the organization has not activated", () => {
    const result = runRecoveryEngine(context([], [], { activeModules: ["logistics"], invoiceTotal: "10", priorInvoices: [{ invoiceId: "x", invoiceNumber: "NSP-884103", total: "10", invoiceDate: null, documentId: null }] }), allRecoveryRules);
    expect(result.findings).toHaveLength(0);
    expect(result.rulesSkipped).toContain("accounts_payable.duplicate-invoice@1.0.0");
  });
});

describe("decimal normalisation", () => {
  it("parses spreadsheet money formats exactly", () => {
    expect(normalizeDecimalInput("$1,234.50")).toBe("1234.5");
    expect(normalizeDecimalInput("(120.00)")).toBe("-120");
    expect(normalizeDecimalInput("1.234,56")).toBe("1234.56");
    expect(normalizeDecimalInput(" 42 ")).toBe("42");
    expect(normalizeDecimalInput("")).toBeNull();
    expect(normalizeDecimalInput("abc")).toBeNull();
  });
});
