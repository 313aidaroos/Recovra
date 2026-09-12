/** Row shapes for the tables the application reads. Money columns arrive from PostgREST as strings. */

export type VendorRow = {
  id: string;
  organization_id: string;
  name: string;
  category: string | null;
  external_id: string | null;
  created_at: string;
};

export type DocumentRow = {
  id: string;
  organization_id: string;
  vendor_id: string | null;
  kind: string;
  filename: string;
  storage_path: string;
  sha256: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
};

export type ContractRow = {
  id: string;
  organization_id: string;
  vendor_id: string;
  source_document_id: string | null;
  title: string;
  effective_from: string | null;
  effective_to: string | null;
  currency: string;
  status: string;
  created_at: string;
};

export type ContractTermRow = {
  id: string;
  organization_id: string;
  contract_id: string;
  term_type: string;
  normalized_key: string;
  value: Record<string, unknown>;
  source_locator: Record<string, unknown>;
  confidence: string | null;
  created_at: string;
};

export type InvoiceRow = {
  id: string;
  organization_id: string;
  vendor_id: string;
  source_document_id: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  service_from: string | null;
  service_to: string | null;
  currency: string;
  total: string;
  status: string;
  created_at: string;
};

export type InvoiceLineRow = {
  id: string;
  organization_id: string;
  invoice_id: string;
  external_line_id: string | null;
  line_number: number | null;
  description: string | null;
  quantity: string | null;
  unit: string | null;
  unit_price: string | null;
  billed_amount: string;
  charge_code: string | null;
  dimensions: Record<string, string>;
  source_locator: Record<string, unknown>;
  created_at: string;
};

export type FindingRow = {
  id: string;
  organization_id: string;
  audit_run_id: string | null;
  vendor_id: string | null;
  invoice_line_id: string | null;
  invoice_id: string | null;
  contract_id: string | null;
  module: string;
  category: string;
  title: string;
  description: string | null;
  currency: string;
  billed_amount: string | null;
  expected_amount: string | null;
  variance_amount: string;
  confidence: string | null;
  severity: string;
  recoverability: string;
  rule_version: string | null;
  calculation_trace: Record<string, unknown>;
  evidence: Array<{ documentId: string; kind: string; locator: string; label: string }>;
  status: string;
  dedupe_key: string;
  created_at: string;
};

export type RecoveryStatus =
  | "detected" | "reviewing" | "verified" | "approval_requested" | "approved" | "rejected"
  | "submitted" | "vendor_reviewing" | "recovered" | "closed";

export type RecoveryRow = {
  id: string;
  organization_id: string;
  finding_id: string;
  status: RecoveryStatus;
  claimed_amount: string | null;
  approved_amount: string | null;
  realized_amount: string | null;
  currency: string;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type RecoveryEventRow = {
  id: string;
  recovery_id: string;
  event_type: string;
  actor_user_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

export type ApprovalRow = {
  id: string;
  organization_id: string;
  recovery_id: string;
  requested_by: string | null;
  decided_by: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  decision_note: string | null;
  requested_at: string;
  decided_at: string | null;
};

export type SavingsLedgerRow = {
  id: string;
  recovery_id: string | null;
  kind: string;
  amount: string;
  currency: string;
  occurred_at: string;
  metadata: Record<string, unknown>;
};

export type AuditLogRow = {
  id: number;
  actor_user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
};

export type ModuleConfigRow = {
  module: string;
  status: string;
  activated_at: string | null;
};
