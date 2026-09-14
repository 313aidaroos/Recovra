import type { LiveWorkspace } from "@/lib/auth/workspace";
import { addDecimal, sumDecimals } from "@/lib/recovery-engine";
import type {
  ContractRow, ContractTermRow, DocumentRow, FindingRow, InvoiceLineRow, InvoiceRow, ProfileRow, RecoveryRow, VendorRow,
} from "./types";
import type { OrganizationRole } from "@/types/workspace";

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export type InvoiceListItem = InvoiceRow & { vendorName: string; findingCount: number; variance: string; documentName: string | null };

export async function loadInvoices(workspace: LiveWorkspace, vendorId?: string): Promise<InvoiceListItem[]> {
  const { supabase, organization } = workspace;
  let query = supabase.from("invoices").select("*, vendor:vendors(name), document:documents!invoices_source_document_id_fkey(filename)").eq("organization_id", organization.id).order("created_at", { ascending: false });
  if (vendorId) query = query.eq("vendor_id", vendorId);
  const [{ data: invoiceRows }, { data: findingRows }] = await Promise.all([
    query,
    supabase.from("findings").select("invoice_id, variance_amount, status").eq("organization_id", organization.id),
  ]);
  const findings = (findingRows ?? []) as Array<Pick<FindingRow, "invoice_id" | "variance_amount" | "status">>;
  type Row = InvoiceRow & { vendor: Pick<VendorRow, "name"> | Pick<VendorRow, "name">[] | null; document: Pick<DocumentRow, "filename"> | Pick<DocumentRow, "filename">[] | null };
  return ((invoiceRows ?? []) as Row[]).map((row) => {
    const mine = findings.filter((finding) => finding.invoice_id === row.id && finding.status !== "dismissed");
    return {
      ...row,
      vendorName: one(row.vendor)?.name ?? "Unknown vendor",
      documentName: one(row.document)?.filename ?? null,
      findingCount: mine.length,
      variance: sumDecimals(mine.map((finding) => finding.variance_amount)),
    };
  });
}

export type InvoiceDetail = {
  invoice: InvoiceRow;
  vendor: VendorRow | null;
  document: DocumentRow | null;
  lines: InvoiceLineRow[];
  findings: FindingRow[];
};

export async function loadInvoiceDetail(workspace: LiveWorkspace, invoiceId: string): Promise<InvoiceDetail | null> {
  const { supabase, organization } = workspace;
  const { data } = await supabase.from("invoices").select("*").eq("id", invoiceId).eq("organization_id", organization.id).maybeSingle();
  if (!data) return null;
  const invoice = data as InvoiceRow;
  const [vendorResult, documentResult, linesResult, findingsResult] = await Promise.all([
    supabase.from("vendors").select("*").eq("id", invoice.vendor_id).maybeSingle(),
    invoice.source_document_id ? supabase.from("documents").select("*").eq("id", invoice.source_document_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("invoice_lines").select("*").eq("invoice_id", invoice.id).order("line_number", { ascending: true }).limit(1000),
    supabase.from("findings").select("*").eq("invoice_id", invoice.id).order("variance_amount", { ascending: false }),
  ]);
  return {
    invoice,
    vendor: (vendorResult.data ?? null) as VendorRow | null,
    document: (documentResult.data ?? null) as DocumentRow | null,
    lines: (linesResult.data ?? []) as InvoiceLineRow[],
    findings: (findingsResult.data ?? []) as FindingRow[],
  };
}

export type ContractListItem = ContractRow & { vendorName: string; termCount: number; documentName: string | null };

export async function loadContracts(workspace: LiveWorkspace): Promise<ContractListItem[]> {
  const { supabase, organization } = workspace;
  const [{ data: contractRows }, { data: termRows }] = await Promise.all([
    supabase.from("contracts").select("*, vendor:vendors(name), document:documents!contracts_source_document_id_fkey(filename)").eq("organization_id", organization.id).order("created_at", { ascending: false }),
    supabase.from("contract_terms").select("contract_id").eq("organization_id", organization.id),
  ]);
  const counts = new Map<string, number>();
  for (const term of (termRows ?? []) as Array<Pick<ContractTermRow, "contract_id">>) counts.set(term.contract_id, (counts.get(term.contract_id) ?? 0) + 1);
  type Row = ContractRow & { vendor: Pick<VendorRow, "name"> | Pick<VendorRow, "name">[] | null; document: Pick<DocumentRow, "filename"> | Pick<DocumentRow, "filename">[] | null };
  return ((contractRows ?? []) as Row[]).map((row) => ({
    ...row,
    vendorName: one(row.vendor)?.name ?? "Unknown vendor",
    documentName: one(row.document)?.filename ?? null,
    termCount: counts.get(row.id) ?? 0,
  }));
}

export type ContractDetail = { contract: ContractRow; vendor: VendorRow | null; document: DocumentRow | null; terms: ContractTermRow[]; findings: FindingRow[] };

export async function loadContractDetail(workspace: LiveWorkspace, contractId: string): Promise<ContractDetail | null> {
  const { supabase, organization } = workspace;
  const { data } = await supabase.from("contracts").select("*").eq("id", contractId).eq("organization_id", organization.id).maybeSingle();
  if (!data) return null;
  const contract = data as ContractRow;
  const [vendorResult, documentResult, termsResult, findingsResult] = await Promise.all([
    supabase.from("vendors").select("*").eq("id", contract.vendor_id).maybeSingle(),
    contract.source_document_id ? supabase.from("documents").select("*").eq("id", contract.source_document_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("contract_terms").select("*").eq("contract_id", contract.id).order("normalized_key", { ascending: true }).limit(2000),
    supabase.from("findings").select("*").eq("contract_id", contract.id).order("variance_amount", { ascending: false }).limit(50),
  ]);
  return {
    contract,
    vendor: (vendorResult.data ?? null) as VendorRow | null,
    document: (documentResult.data ?? null) as DocumentRow | null,
    terms: (termsResult.data ?? []) as ContractTermRow[],
    findings: (findingsResult.data ?? []) as FindingRow[],
  };
}

export type VendorListItem = VendorRow & {
  spend: string;
  invoiceCount: number;
  contractCount: number;
  openVariance: string;
  recovered: string;
  findingCount: number;
  topCategory: string | null;
};

export async function loadVendors(workspace: LiveWorkspace): Promise<VendorListItem[]> {
  const { supabase, organization } = workspace;
  const [vendorsResult, invoicesResult, contractsResult, findingsResult, recoveriesResult] = await Promise.all([
    supabase.from("vendors").select("*").eq("organization_id", organization.id).order("name", { ascending: true }),
    supabase.from("invoices").select("vendor_id, total").eq("organization_id", organization.id),
    supabase.from("contracts").select("vendor_id, status").eq("organization_id", organization.id),
    supabase.from("findings").select("id, vendor_id, variance_amount, status, category").eq("organization_id", organization.id),
    supabase.from("recoveries").select("finding_id, realized_amount, status").eq("organization_id", organization.id),
  ]);
  const invoices = (invoicesResult.data ?? []) as Array<Pick<InvoiceRow, "vendor_id" | "total">>;
  const contracts = (contractsResult.data ?? []) as Array<Pick<ContractRow, "vendor_id" | "status">>;
  const findings = (findingsResult.data ?? []) as Array<Pick<FindingRow, "id" | "vendor_id" | "variance_amount" | "status" | "category">>;
  const recoveries = (recoveriesResult.data ?? []) as Array<Pick<RecoveryRow, "finding_id" | "realized_amount" | "status">>;
  const realizedByFinding = new Map(recoveries.filter((recovery) => recovery.realized_amount).map((recovery) => [recovery.finding_id, recovery.realized_amount as string]));

  return ((vendorsResult.data ?? []) as VendorRow[]).map((vendor) => {
    const mine = findings.filter((finding) => finding.vendor_id === vendor.id);
    const open = mine.filter((finding) => finding.status !== "dismissed" && finding.status !== "resolved");
    const categories = new Map<string, number>();
    for (const finding of mine) categories.set(finding.category, (categories.get(finding.category) ?? 0) + 1);
    const topCategory = [...categories.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
    return {
      ...vendor,
      spend: sumDecimals(invoices.filter((invoice) => invoice.vendor_id === vendor.id).map((invoice) => invoice.total)),
      invoiceCount: invoices.filter((invoice) => invoice.vendor_id === vendor.id).length,
      contractCount: contracts.filter((contract) => contract.vendor_id === vendor.id && contract.status === "active").length,
      openVariance: sumDecimals(open.map((finding) => finding.variance_amount)),
      recovered: mine.reduce((total, finding) => addDecimal(total, realizedByFinding.get(finding.id) ?? "0"), "0"),
      findingCount: mine.length,
      topCategory,
    };
  });
}

export type DocumentListItem = DocumentRow & { vendorName: string | null };

export async function loadDocuments(workspace: LiveWorkspace): Promise<DocumentListItem[]> {
  const { supabase, organization } = workspace;
  const { data } = await supabase.from("documents").select("*, vendor:vendors(name)").eq("organization_id", organization.id).order("created_at", { ascending: false }).limit(200);
  type Row = DocumentRow & { vendor: Pick<VendorRow, "name"> | Pick<VendorRow, "name">[] | null };
  return ((data ?? []) as Row[]).map((row) => ({ ...row, vendorName: one(row.vendor)?.name ?? null }));
}

export type MemberListItem = { userId: string; role: OrganizationRole; email: string; fullName: string; joinedAt: string };

export async function loadMembers(workspace: LiveWorkspace): Promise<MemberListItem[]> {
  const { supabase, organization } = workspace;
  const { data } = await supabase.from("organization_members").select("user_id, role, created_at").eq("organization_id", organization.id).order("created_at", { ascending: true });
  const rows = (data ?? []) as Array<{ user_id: string; role: OrganizationRole; created_at: string }>;
  const ids = rows.map((row) => row.user_id);
  const profiles = ids.length > 0 ? ((await supabase.from("profiles").select("id, email, full_name").in("id", ids)).data ?? []) as ProfileRow[] : [];
  const byId = new Map(profiles.map((profile) => [profile.id, profile]));
  return rows.map((row) => ({
    userId: row.user_id,
    role: row.role,
    email: byId.get(row.user_id)?.email ?? "",
    fullName: byId.get(row.user_id)?.full_name ?? "",
    joinedAt: row.created_at,
  }));
}

export async function createSignedDocumentUrl(workspace: LiveWorkspace, document: DocumentRow) {
  if (!document.storage_path || document.storage_path === "pending") return null;
  const { data } = await workspace.supabase.storage.from("documents").createSignedUrl(document.storage_path, 60 * 10);
  return data?.signedUrl ?? null;
}
