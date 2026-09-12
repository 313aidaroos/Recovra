import { NextResponse } from "next/server";
import { logisticsRateVarianceRule, runRecoveryEngine } from "@/lib/recovery-engine";

export async function POST(){
  const result = runRecoveryEngine({
    organizationId: "00000000-0000-0000-0000-000000000001",
    chargeId: "sample-invoice-line-001",
    module: "logistics",
    vendorId: "sample-northstar",
    currency: "USD",
    billedAmount: "11680.00",
    quantity: "1000",
    contractedUnitRate: "4.15",
    evidence: [
      { documentId: "sample-invoice", kind: "invoice", locator: "page:4", label: "Sample invoice lines" },
      { documentId: "sample-contract", kind: "contract", locator: "section:4.2", label: "Sample rate clause" },
    ],
  }, [logisticsRateVarianceRule]);

  return NextResponse.json({
    demo:true,
    message:"Sample adapter only. Production ingestion and audit execution must run through an authenticated background workflow.",
    audit_run:{status:"completed",findings:result.findings.length,currency:"USD"},
    result,
  });
}
