export type EvidenceKind = "invoice" | "contract" | "rate_sheet" | "operational_event";

export type EvidenceReference = {
  documentId: string;
  kind: EvidenceKind;
  /** Where inside the document the fact lives, e.g. "row:42", "sheet:Rates!B7", "page:4". */
  locator: string;
  label: string;
};

/** Normalised freight/AP dimensions. All values upper-cased strings; absent keys mean "unspecified". */
export type ChargeDimensions = Partial<Record<
  "mode" | "origin" | "destination" | "equipment" | "service_level" | "reference" | "free_days" | "actual_days" | "weight" | "zone",
  string
>>;

export type ChargeLine = {
  chargeId: string;
  invoiceId: string;
  invoiceNumber: string | null;
  lineNumber: number;
  vendorId: string;
  currency: string;
  chargeCode: string;
  description: string;
  quantity: string | null;
  unit: string | null;
  unitPrice: string | null;
  billedAmount: string;
  dimensions: ChargeDimensions;
  evidence: EvidenceReference[];
};

export type ContractTermType = "rate" | "percent" | "free_time" | "allowed_charge";

export type ContractTermValue = {
  /** Contracted unit rate (per unit or flat). */
  rate?: string;
  /** "per_unit" (default) or "flat". */
  basis?: "per_unit" | "flat";
  unit?: string;
  /** Percentage such as "18.5" for percent terms. */
  percent?: string;
  /** Charge codes the percent applies to (e.g. LINEHAUL). */
  percentBasisCodes?: string[];
  /** Free days for detention/demurrage/per-diem terms. */
  freeDays?: string;
  minimum?: string;
  currency?: string;
  clause?: string;
};

export type ContractTerm = {
  termId: string;
  contractId: string;
  contractTitle: string;
  termType: ContractTermType;
  chargeCode: string;
  dimensions: ChargeDimensions;
  value: ContractTermValue;
  evidence: EvidenceReference | null;
};

export type PriorInvoice = {
  invoiceId: string;
  invoiceNumber: string | null;
  total: string;
  invoiceDate: string | null;
  documentId: string | null;
};

export type AuditContext = {
  organizationId: string;
  vendorId: string;
  invoiceId: string;
  invoiceNumber: string | null;
  invoiceTotal: string;
  invoiceDocumentId: string | null;
  currency: string;
  /** Modules activated for the organization; rules outside these modules are skipped. */
  activeModules: string[];
  lines: ChargeLine[];
  terms: ContractTerm[];
  priorInvoices: PriorInvoice[];
};

export type CalculationTrace = {
  formula: string;
  operands: Record<string, string>;
  expectedAmount: string | null;
  billedAmount: string;
  varianceAmount: string;
  ruleVersion: string;
  matchedTerm?: { termId: string; contractId: string; key: string };
  /** Present when the invoice rows were transcribed from a PDF by a model rather than read from a spreadsheet. */
  sourceExtraction?: { method: "ai"; provider: string; model: string; confidence: string; extractedAt: string; humanVerificationRequired: true; confidenceCapApplied: boolean };
};

export type Severity = "low" | "medium" | "high" | "critical";
export type Recoverability = "recoverable" | "needs_review";

export type RuleFinding = {
  ruleId: string;
  ruleVersion: string;
  module: string;
  findingType: string;
  title: string;
  /** Stable per organization: re-running an audit updates instead of duplicating. */
  dedupeKey: string;
  chargeId: string | null;
  invoiceId: string;
  contractId: string | null;
  expectedValue: string | null;
  actualValue: string;
  variance: string;
  recoverableAmount: string;
  currency: string;
  confidence: string;
  severity: Severity;
  recoverability: Recoverability;
  evidenceReferences: EvidenceReference[];
  explanation: string;
  calculationTrace: CalculationTrace;
};

export type LineRule = {
  id: string;
  module: string;
  version: string;
  scope: "line";
  evaluate(line: ChargeLine, context: AuditContext): RuleFinding | null;
};

export type InvoiceRule = {
  id: string;
  module: string;
  version: string;
  scope: "invoice";
  evaluate(context: AuditContext): RuleFinding[];
};

export type RecoveryRule = LineRule | InvoiceRule;
