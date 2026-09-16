import { createHash } from "node:crypto";
import { createAnonSupabase } from "@/lib/supabase/anon";
import type { SampleAuditResult } from "./sample-audit";

export type DemoPersistResult =
  | { persisted: true; id: string }
  | { persisted: false; reason: string };

export function demoTemplateContentHash(invoiceCsv: string, rateSheetCsv: string) {
  return createHash("sha256")
    .update("sample-templates\n")
    .update(invoiceCsv)
    .update("\n")
    .update(rateSheetCsv)
    .digest("hex");
}

/**
 * Writes Recovra's bundled sample audit to demo_audit_runs.
 * Visitor uploads are never stored. Claims cannot be marked sent.
 */
export async function persistDemoAuditRun(
  result: SampleAuditResult,
  contentHash: string,
): Promise<DemoPersistResult> {
  if (result.source !== "sample-templates") {
    return { persisted: false, reason: "Visitor uploads are not stored. Only Recovra's labeled sample templates are persisted." };
  }
  if (result.claimsSent) {
    return { persisted: false, reason: "Refusing to persist a run that sent claims." };
  }
  if (!result.demo) {
    return { persisted: false, reason: "Refusing to persist an unlabeled run." };
  }
  if (!/^[0-9a-f]{64}$/.test(contentHash)) {
    return { persisted: false, reason: "Invalid content hash." };
  }

  const supabase = createAnonSupabase();
  if (!supabase) return { persisted: false, reason: "Supabase is not configured." };

  const stored: SampleAuditResult = { ...result, demo: true, claimsSent: false, source: "sample-templates" };
  const { data, error } = await supabase.rpc("upsert_demo_audit_run", {
    p_content_hash: contentHash,
    p_billed: stored.totals.billed,
    p_variance: stored.totals.variance,
    p_finding_count: stored.totals.findings,
    p_recoverable_count: stored.totals.recoverable,
    p_needs_review_count: stored.totals.needsReview,
    p_currency: stored.invoices[0]?.currency ?? "USD",
    p_result: stored,
  });

  if (error || !data) {
    return { persisted: false, reason: error?.message ?? "Persist RPC returned no id." };
  }
  return { persisted: true, id: String(data) };
}

export async function loadDemoAuditRun(id: string): Promise<SampleAuditResult | null> {
  const supabase = createAnonSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("demo_audit_runs")
    .select("result, labeled_demo, claims_sent, source")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as { result: SampleAuditResult; labeled_demo: boolean; claims_sent: boolean; source: string };
  if (!row.labeled_demo || row.claims_sent || row.source !== "sample-templates") return null;
  return { ...row.result, demo: true, claimsSent: false, source: "sample-templates" };
}
