import type { LiveWorkspace } from "@/lib/auth/workspace";
import { RECOVERY_STATUS_LABELS } from "@/lib/recovery/workflow";
import { addDecimal, sumDecimals } from "@/lib/recovery-engine";
import { loadFindings, type FindingListItem } from "./findings";
import type { AuditLogRow, DocumentRow, FindingRow, InvoiceRow, RecoveryRow, SavingsLedgerRow, VendorRow } from "./types";

export type DashboardMetrics = {
  monitored: string;
  found: string;
  needsReview: string;
  approved: string;
  recovered: string;
  pendingApprovalCount: number;
  openFindingCount: number;
  invoiceCount: number;
  vendorCount: number;
  documentCount: number;
};

export type PipelineStage = { status: string; label: string; count: number; amount: string };

export type DashboardData = {
  metrics: DashboardMetrics;
  topFindings: FindingListItem[];
  pipeline: PipelineStage[];
  activity: AuditLogRow[];
  recentDocuments: DocumentRow[];
  spendByVendor: Array<{ vendor: string; amount: string; share: number }>;
  monthlyVariance: Array<{ month: string; amount: string }>;
};

const PIPELINE_ORDER = ["detected", "reviewing", "verified", "approval_requested", "approved", "submitted", "vendor_reviewing", "recovered"] as const;

export async function loadDashboard(workspace: LiveWorkspace): Promise<DashboardData> {
  const { supabase, organization } = workspace;
  const [invoicesResult, findingsResult, recoveriesResult, ledgerResult, activityResult, documentsResult, vendorsResult, topFindings] = await Promise.all([
    supabase.from("invoices").select("id, vendor_id, total, invoice_date, created_at").eq("organization_id", organization.id),
    supabase.from("findings").select("id, variance_amount, recoverability, status, created_at").eq("organization_id", organization.id),
    supabase.from("recoveries").select("id, status, claimed_amount, approved_amount, realized_amount").eq("organization_id", organization.id),
    supabase.from("savings_ledger").select("kind, amount").eq("organization_id", organization.id),
    supabase.from("audit_logs").select("id, actor_user_id, action, entity_type, entity_id, metadata, created_at").eq("organization_id", organization.id).order("created_at", { ascending: false }).limit(8),
    supabase.from("documents").select("*").eq("organization_id", organization.id).order("created_at", { ascending: false }).limit(4),
    supabase.from("vendors").select("id, name").eq("organization_id", organization.id),
    loadFindings(workspace, { limit: 6 }),
  ]);

  const invoices = (invoicesResult.data ?? []) as Array<Pick<InvoiceRow, "id" | "vendor_id" | "total" | "invoice_date" | "created_at">>;
  const findings = (findingsResult.data ?? []) as Array<Pick<FindingRow, "id" | "variance_amount" | "recoverability" | "status" | "created_at">>;
  const recoveries = (recoveriesResult.data ?? []) as Array<Pick<RecoveryRow, "id" | "status" | "claimed_amount" | "approved_amount" | "realized_amount">>;
  const ledger = (ledgerResult.data ?? []) as Array<Pick<SavingsLedgerRow, "kind" | "amount">>;
  const vendors = (vendorsResult.data ?? []) as Array<Pick<VendorRow, "id" | "name">>;

  const openFindings = findings.filter((finding) => finding.status !== "dismissed" && finding.status !== "resolved");
  const metrics: DashboardMetrics = {
    monitored: sumDecimals(invoices.map((invoice) => invoice.total)),
    found: sumDecimals(openFindings.filter((finding) => finding.recoverability === "recoverable").map((finding) => finding.variance_amount)),
    needsReview: sumDecimals(openFindings.filter((finding) => finding.recoverability !== "recoverable").map((finding) => finding.variance_amount)),
    approved: sumDecimals(recoveries.filter((recovery) => recovery.status === "approved" || recovery.status === "submitted" || recovery.status === "vendor_reviewing").map((recovery) => recovery.approved_amount ?? "0")),
    recovered: sumDecimals(ledger.filter((entry) => entry.kind === "realized").map((entry) => entry.amount)),
    pendingApprovalCount: recoveries.filter((recovery) => recovery.status === "approval_requested").length,
    openFindingCount: openFindings.length,
    invoiceCount: invoices.length,
    vendorCount: vendors.length,
    documentCount: 0,
  };

  const { count: documentCount } = await supabase.from("documents").select("id", { count: "exact", head: true }).eq("organization_id", organization.id);
  metrics.documentCount = documentCount ?? 0;

  const pipeline: PipelineStage[] = PIPELINE_ORDER.map((status) => {
    const matching = recoveries.filter((recovery) => recovery.status === status);
    return {
      status,
      label: RECOVERY_STATUS_LABELS[status],
      count: matching.length,
      amount: sumDecimals(matching.map((recovery) => recovery.realized_amount ?? recovery.approved_amount ?? recovery.claimed_amount ?? "0")),
    };
  });

  const vendorTotals = new Map<string, string>();
  for (const invoice of invoices) {
    vendorTotals.set(invoice.vendor_id, addDecimal(vendorTotals.get(invoice.vendor_id) ?? "0", invoice.total));
  }
  const monitoredNumber = Number(metrics.monitored) || 0;
  const spendByVendor = [...vendorTotals.entries()]
    .map(([vendorId, amount]) => ({ vendor: vendors.find((vendor) => vendor.id === vendorId)?.name ?? "Unknown", amount, share: monitoredNumber > 0 ? Math.round((Number(amount) / monitoredNumber) * 100) : 0 }))
    .sort((left, right) => Number(right.amount) - Number(left.amount))
    .slice(0, 5);

  const months = new Map<string, string>();
  for (const finding of findings) {
    const month = finding.created_at.slice(0, 7);
    months.set(month, addDecimal(months.get(month) ?? "0", finding.variance_amount));
  }
  const monthlyVariance = [...months.entries()].sort(([left], [right]) => left.localeCompare(right)).slice(-12).map(([month, amount]) => ({ month, amount }));

  return {
    metrics,
    topFindings,
    pipeline,
    activity: (activityResult.data ?? []) as AuditLogRow[],
    recentDocuments: (documentsResult.data ?? []) as DocumentRow[],
    spendByVendor,
    monthlyVariance,
  };
}
