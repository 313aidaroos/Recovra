import { NextResponse } from "next/server";
import { logisticsRateVarianceRule, runRecoveryEngine } from "@/lib/recovery-engine";

/** Sample adapter: shows the engine's deterministic output shape without touching tenant data. */
export async function POST() {
  const result = runRecoveryEngine({
    organizationId: "00000000-0000-0000-0000-000000000001",
    vendorId: "sample-northstar",
    invoiceId: "sample-invoice",
    invoiceNumber: "NSP-884103",
    invoiceTotal: "11680.00",
    invoiceDocumentId: "sample-invoice-document",
    currency: "USD",
    activeModules: ["logistics"],
    lines: [{
      chargeId: "sample-invoice-line-001",
      invoiceId: "sample-invoice",
      invoiceNumber: "NSP-884103",
      lineNumber: 1,
      vendorId: "sample-northstar",
      currency: "USD",
      chargeCode: "RES_SURCHARGE",
      description: "Residential delivery surcharge",
      quantity: "1000",
      unit: "SHIPMENT",
      unitPrice: "11.68",
      billedAmount: "11680.00",
      dimensions: { mode: "PARCEL" },
      evidence: [{ documentId: "sample-invoice-document", kind: "invoice", locator: "page:4", label: "Sample invoice lines" }],
    }],
    terms: [{
      termId: "sample-term",
      contractId: "sample-contract",
      contractTitle: "Parcel Services Agreement 2026",
      termType: "rate",
      chargeCode: "RES_SURCHARGE",
      dimensions: { mode: "PARCEL" },
      value: { rate: "4.15", unit: "SHIPMENT", clause: "Section 4.2 · Residential Delivery Surcharge" },
      evidence: { documentId: "sample-contract-document", kind: "contract", locator: "section:4.2", label: "Sample rate clause" },
    }],
    priorInvoices: [],
  }, [logisticsRateVarianceRule]);

  return NextResponse.json({
    demo: true,
    message: "Sample adapter only. Tenant audits run through the authenticated ingestion workflow.",
    audit_run: { status: "completed", findings: result.findings.length, currency: "USD" },
    result,
  });
}
