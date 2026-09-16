import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { demoTemplateContentHash, persistDemoAuditRun, type DemoPersistResult } from "@/lib/demo/persist-demo-run";
import { runBundledSampleAudit, runSampleAuditFromFiles, type SampleAuditResult } from "@/lib/demo/sample-audit";
import { isSpreadsheetFile } from "@/lib/ingestion/tabular";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024;

function payload(result: SampleAuditResult, persistence: DemoPersistResult | { persisted: false; reason: string }) {
  const persistedMessage = persistence.persisted
    ? `Demo data. Findings calculated from the bundled templates and saved to Recovra's database as run ${persistence.id}. Nothing was claimed; human approval is required before any vendor claim.`
    : result.message;
  return {
    demo: true,
    claimsSent: false,
    message: persistedMessage,
    source: result.source,
    persistence,
    audit_run: {
      status: "completed",
      findings: result.totals.findings,
      currency: result.invoices[0]?.currency ?? "USD",
      billed: result.totals.billed,
      variance: result.totals.variance,
      recoverable: result.totals.recoverable,
      needsReview: result.totals.needsReview,
      persisted: persistence.persisted,
      id: persistence.persisted ? persistence.id : null,
    },
    result,
  };
}

async function bundledSample() {
  const dir = join(process.cwd(), "public", "templates");
  const [invoiceCsv, rateSheetCsv] = await Promise.all([
    readFile(join(dir, "recovra-invoice-template.csv"), "utf8"),
    readFile(join(dir, "recovra-rate-sheet-template.csv"), "utf8"),
  ]);
  const result = runBundledSampleAudit(invoiceCsv, rateSheetCsv);
  const persistence = await persistDemoAuditRun(result, demoTemplateContentHash(invoiceCsv, rateSheetCsv));
  return { result, persistence };
}

export async function GET() {
  try {
    const { result, persistence } = await bundledSample();
    return NextResponse.json(payload(result, persistence));
  } catch (error) {
    return NextResponse.json({ demo: true, claimsSent: false, error: error instanceof Error ? error.message : "Sample audit failed." }, { status: 500 });
  }
}

async function fileFromForm(form: FormData, key: string) {
  const value = form.get(key);
  if (!(value instanceof File) || value.size === 0) return null;
  if (value.size > MAX_BYTES) throw new Error(`${value.name} is over 2 MB. Demo uploads are capped so nothing is stored.`);
  if (!isSpreadsheetFile(value.name, value.type)) throw new Error(`${value.name} must be CSV or XLSX.`);
  return { name: value.name, buffer: await value.arrayBuffer() };
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      const { result, persistence } = await bundledSample();
      return NextResponse.json(payload(result, persistence));
    }

    const form = await request.formData();
    const invoice = await fileFromForm(form, "invoice") ?? await fileFromForm(form, "file");
    const rateSheet = await fileFromForm(form, "rate_sheet") ?? await fileFromForm(form, "ratesheet");
    if (!invoice) {
      const { result, persistence } = await bundledSample();
      return NextResponse.json(payload(result, persistence));
    }

    const result = await runSampleAuditFromFiles(invoice, rateSheet ?? undefined);
    return NextResponse.json(payload(result, {
      persisted: false,
      reason: "Visitor uploads are audited in memory only and are not written to Recovra's database.",
    }));
  } catch (error) {
    return NextResponse.json({ demo: true, claimsSent: false, error: error instanceof Error ? error.message : "Audit failed." }, { status: 400 });
  }
}
