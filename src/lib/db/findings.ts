import type { LiveWorkspace } from "@/lib/auth/workspace";
import { RECOVERY_STATUS_LABELS } from "@/lib/recovery/workflow";
import type {
  ApprovalRow, ContractRow, DocumentRow, FindingRow, InvoiceLineRow, InvoiceRow, ProfileRow, RecoveryEventRow, RecoveryRow, VendorRow,
} from "./types";

export type FindingListItem = {
  id: string;
  vendor: string;
  vendorId: string | null;
  module: string;
  category: string;
  title: string;
  billedAmount: string | null;
  expectedAmount: string | null;
  variance: string;
  confidence: string | null;
  severity: string;
  recoverability: string;
  detectedAt: string;
  evidenceCount: number;
  recoveryStatus: string;
  recoveryStatusLabel: string;
  recoveryId: string | null;
  ownerName: string | null;
  invoiceNumber: string | null;
  invoiceId: string | null;
  currency: string;
};

type FindingJoin = FindingRow & {
  vendor: Pick<VendorRow, "name"> | Pick<VendorRow, "name">[] | null;
  invoice: Pick<InvoiceRow, "invoice_number"> | Pick<InvoiceRow, "invoice_number">[] | null;
  recovery: Pick<RecoveryRow, "id" | "status" | "owner_user_id"> | Pick<RecoveryRow, "id" | "status" | "owner_user_id">[] | null;
};

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function loadFindings(workspace: LiveWorkspace, options: { limit?: number; invoiceId?: string; vendorId?: string } = {}): Promise<FindingListItem[]> {
  const { supabase, organization } = workspace;
  let query = supabase
    .from("findings")
    .select("*, vendor:vendors(name), invoice:invoices(invoice_number), recovery:recoveries(id, status, owner_user_id)")
    .eq("organization_id", organization.id)
    .order("variance_amount", { ascending: false });
  if (options.invoiceId) query = query.eq("invoice_id", options.invoiceId);
  if (options.vendorId) query = query.eq("vendor_id", options.vendorId);
  if (options.limit) query = query.limit(options.limit);
  const { data } = await query;
  const rows = (data ?? []) as FindingJoin[];

  const ownerIds = [...new Set(rows.map((row) => one(row.recovery)?.owner_user_id).filter((id): id is string => Boolean(id)))];
  const profiles = ownerIds.length > 0
    ? ((await supabase.from("profiles").select("id, email, full_name").in("id", ownerIds)).data ?? []) as ProfileRow[]
    : [];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  return rows.map((row) => {
    const recovery = one(row.recovery);
    const owner = recovery?.owner_user_id ? profileById.get(recovery.owner_user_id) : null;
    const status = recovery?.status ?? "detected";
    return {
      id: row.id,
      vendor: one(row.vendor)?.name ?? "Unknown vendor",
      vendorId: row.vendor_id,
      module: row.module,
      category: row.category,
      title: row.title,
      billedAmount: row.billed_amount,
      expectedAmount: row.expected_amount,
      variance: row.variance_amount,
      confidence: row.confidence,
      severity: row.severity,
      recoverability: row.recoverability,
      detectedAt: row.created_at,
      evidenceCount: Array.isArray(row.evidence) ? row.evidence.length : 0,
      recoveryStatus: status,
      recoveryStatusLabel: RECOVERY_STATUS_LABELS[status as keyof typeof RECOVERY_STATUS_LABELS] ?? status,
      recoveryId: recovery?.id ?? null,
      ownerName: owner ? owner.full_name || owner.email : null,
      invoiceNumber: one(row.invoice)?.invoice_number ?? null,
      invoiceId: row.invoice_id,
      currency: row.currency,
    };
  });
}

export type FindingDetail = {
  finding: FindingRow;
  vendor: VendorRow | null;
  invoice: InvoiceRow | null;
  line: InvoiceLineRow | null;
  contract: ContractRow | null;
  documents: DocumentRow[];
  recovery: RecoveryRow | null;
  events: Array<RecoveryEventRow & { actorName: string | null }>;
  approvals: ApprovalRow[];
  siblingLines: InvoiceLineRow[];
};

export async function loadFindingDetail(workspace: LiveWorkspace, findingId: string): Promise<FindingDetail | null> {
  const { supabase, organization } = workspace;
  const { data: findingData } = await supabase.from("findings").select("*").eq("id", findingId).eq("organization_id", organization.id).maybeSingle();
  if (!findingData) return null;
  const finding = findingData as FindingRow;

  const documentIds = [...new Set((finding.evidence ?? []).map((reference) => reference.documentId))];
  const [vendorResult, invoiceResult, lineResult, contractResult, documentsResult, recoveryResult] = await Promise.all([
    finding.vendor_id ? supabase.from("vendors").select("*").eq("id", finding.vendor_id).maybeSingle() : Promise.resolve({ data: null }),
    finding.invoice_id ? supabase.from("invoices").select("*").eq("id", finding.invoice_id).maybeSingle() : Promise.resolve({ data: null }),
    finding.invoice_line_id ? supabase.from("invoice_lines").select("*").eq("id", finding.invoice_line_id).maybeSingle() : Promise.resolve({ data: null }),
    finding.contract_id ? supabase.from("contracts").select("*").eq("id", finding.contract_id).maybeSingle() : Promise.resolve({ data: null }),
    documentIds.length > 0 ? supabase.from("documents").select("*").in("id", documentIds) : Promise.resolve({ data: [] }),
    supabase.from("recoveries").select("*").eq("finding_id", finding.id).maybeSingle(),
  ]);

  const recovery = (recoveryResult.data ?? null) as RecoveryRow | null;
  const [eventsResult, approvalsResult, siblingsResult] = await Promise.all([
    recovery ? supabase.from("recovery_events").select("*").eq("recovery_id", recovery.id).order("created_at", { ascending: true }) : Promise.resolve({ data: [] }),
    recovery ? supabase.from("approvals").select("*").eq("recovery_id", recovery.id).order("requested_at", { ascending: false }) : Promise.resolve({ data: [] }),
    finding.invoice_id ? supabase.from("invoice_lines").select("*").eq("invoice_id", finding.invoice_id).order("line_number", { ascending: true }).limit(200) : Promise.resolve({ data: [] }),
  ]);

  const events = (eventsResult.data ?? []) as RecoveryEventRow[];
  const actorIds = [...new Set(events.map((event) => event.actor_user_id).filter((id): id is string => Boolean(id)))];
  const profiles = actorIds.length > 0 ? ((await supabase.from("profiles").select("id, email, full_name").in("id", actorIds)).data ?? []) as ProfileRow[] : [];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  return {
    finding,
    vendor: (vendorResult.data ?? null) as VendorRow | null,
    invoice: (invoiceResult.data ?? null) as InvoiceRow | null,
    line: (lineResult.data ?? null) as InvoiceLineRow | null,
    contract: (contractResult.data ?? null) as ContractRow | null,
    documents: (documentsResult.data ?? []) as DocumentRow[],
    recovery,
    events: events.map((event) => {
      const actor = event.actor_user_id ? profileById.get(event.actor_user_id) : null;
      return { ...event, actorName: actor ? actor.full_name || actor.email : null };
    }),
    approvals: (approvalsResult.data ?? []) as ApprovalRow[],
    siblingLines: (siblingsResult.data ?? []) as InvoiceLineRow[],
  };
}
