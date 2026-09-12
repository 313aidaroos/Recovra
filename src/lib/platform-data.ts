export type OpportunityStatus =
  | "Detected"
  | "Reviewing"
  | "Verified"
  | "Claim Ready"
  | "Submitted"
  | "Vendor Reviewing"
  | "Approved"
  | "Recovered"
  | "Rejected";

export type Opportunity = {
  id: string;
  vendor: string;
  module: string;
  issue: string;
  invoicedAmount: number;
  expectedAmount: number;
  potentialRecovery: number;
  confidence: number;
  severity: "Critical" | "High" | "Medium" | "Low";
  detectedAt: string;
  evidenceCount: number;
  status: OpportunityStatus;
  owner: string;
  invoice: string;
  contract: string;
  clause: string;
  explanation: string;
  recommendedAction: string;
};

export const dashboardMetrics = {
  monitored: 18_420_319,
  found: 746_210,
  recovered: 481_904,
  prevented: 182_640,
  pending: 81_666,
};

export const opportunities: Opportunity[] = [
  {
    id: "RCV-2481",
    vendor: "NorthStar Parcel",
    module: "Logistics",
    issue: "Residential surcharge discrepancy",
    invoicedAmount: 142_870,
    expectedAmount: 118_690,
    potentialRecovery: 24_180,
    confidence: 94,
    severity: "High",
    detectedAt: "Sep 10, 2026",
    evidenceCount: 18,
    status: "Claim Ready",
    owner: "Maya Chen",
    invoice: "NSP-884103",
    contract: "Parcel Services Agreement 2026",
    clause: "Section 4.2 · Residential Delivery Surcharge",
    explanation:
      "The contracted residential surcharge is $4.15 per eligible shipment. 3,210 affected lines were billed at $11.68, producing a deterministic variance of $24,180.30.",
    recommendedAction:
      "Approve the evidence package and request a line-level credit for the affected billing period.",
  },
  {
    id: "RCV-2482",
    vendor: "Nimbus Cloud",
    module: "Cloud",
    issue: "Unused resources and commitment variance",
    invoicedAmount: 311_420,
    expectedAmount: 294_200,
    potentialRecovery: 17_220,
    confidence: 89,
    severity: "Medium",
    detectedAt: "Sep 9, 2026",
    evidenceCount: 12,
    status: "Verified",
    owner: "Jon Bell",
    invoice: "NC-2026-0901",
    contract: "Enterprise Cloud Commitment",
    clause: "Schedule B · Committed Use Credits",
    explanation:
      "Committed-use credits present in the agreement were not applied to two eligible compute families.",
    recommendedAction: "Validate resource eligibility with the cloud owner before preparing a billing case.",
  },
  {
    id: "RCV-2483",
    vendor: "Veridian Wireless",
    module: "Telecom",
    issue: "Inactive corporate lines",
    invoicedAmount: 83_140,
    expectedAmount: 69_740,
    potentialRecovery: 13_400,
    confidence: 95,
    severity: "High",
    detectedAt: "Sep 8, 2026",
    evidenceCount: 31,
    status: "Reviewing",
    owner: "Ava Allen",
    invoice: "VW-0908-44",
    contract: "Corporate Mobility Agreement",
    clause: "Section 7 · Deactivated Lines",
    explanation: "HR and device inventory show 41 lines with no assigned employee or usage for 90 days.",
    recommendedAction: "Confirm line owners, then request cancellation and eligible retroactive credits.",
  },
  {
    id: "RCV-2484",
    vendor: "DataDesk",
    module: "SaaS",
    issue: "Unused enterprise licenses",
    invoicedAmount: 96_200,
    expectedAmount: 81_290,
    potentialRecovery: 14_910,
    confidence: 99,
    severity: "Medium",
    detectedAt: "Sep 7, 2026",
    evidenceCount: 9,
    status: "Approved",
    owner: "Maya Chen",
    invoice: "DD-92011",
    contract: "Enterprise License Order",
    clause: "True-down Rider · Section 2",
    explanation: "126 paid seats have no active identity assignment following the latest roster change.",
    recommendedAction: "Apply the approved true-down at renewal and record prevented spend.",
  },
  {
    id: "RCV-2485",
    vendor: "Rapid 3PL",
    module: "3PL",
    issue: "Storage billed above pallet-day inventory",
    invoicedAmount: 74_880,
    expectedAmount: 63_000,
    potentialRecovery: 11_880,
    confidence: 96,
    severity: "High",
    detectedAt: "Sep 5, 2026",
    evidenceCount: 24,
    status: "Submitted",
    owner: "Jon Bell",
    invoice: "R3PL-11028",
    contract: "Warehousing Services Schedule",
    clause: "Exhibit A · Daily Pallet Storage",
    explanation: "WMS daily snapshots support 2,970 fewer pallet-days than the monthly invoice.",
    recommendedAction: "Monitor the submitted claim and request WMS reconciliation from the vendor.",
  },
  {
    id: "RCV-2486",
    vendor: "Foundry Supply",
    module: "Manufacturing",
    issue: "Contract price variance",
    invoicedAmount: 129_440,
    expectedAmount: 122_310,
    potentialRecovery: 7_130,
    confidence: 92,
    severity: "Medium",
    detectedAt: "Sep 4, 2026",
    evidenceCount: 15,
    status: "Detected",
    owner: "Unassigned",
    invoice: "FS-44802",
    contract: "Materials Framework Agreement",
    clause: "Price Schedule 3 · Aluminum Components",
    explanation: "Seven SKUs were invoiced above the active price schedule.",
    recommendedAction: "Assign a reviewer and validate amendment effective dates.",
  },
];

export const invoices = [
  ["NSP-884103", "NorthStar Parcel", "$142,870", "Sep 10, 2026", "Audited", "$24,180", "Parcel Services Agreement", "3"],
  ["NC-2026-0901", "Nimbus Cloud", "$311,420", "Sep 9, 2026", "Reviewing", "$17,220", "Enterprise Cloud Commitment", "2"],
  ["VW-0908-44", "Veridian Wireless", "$83,140", "Sep 8, 2026", "Audited", "$13,400", "Corporate Mobility Agreement", "1"],
  ["DD-92011", "DataDesk", "$96,200", "Sep 7, 2026", "Approved", "$14,910", "Enterprise License Order", "2"],
  ["R3PL-11028", "Rapid 3PL", "$74,880", "Sep 5, 2026", "Submitted", "$11,880", "Warehousing Services Schedule", "1"],
];

export const contracts = [
  ["Parcel Services Agreement 2026", "NorthStar Parcel", "Jan 1, 2026", "Dec 31, 2027", "Active", "Dec 1, 2027", "28"],
  ["Enterprise Cloud Commitment", "Nimbus Cloud", "Apr 1, 2026", "Mar 31, 2029", "Active", "Jan 31, 2029", "16"],
  ["Corporate Mobility Agreement", "Veridian Wireless", "Jun 15, 2025", "Jun 14, 2027", "Review", "Mar 14, 2027", "34"],
  ["Enterprise License Order", "DataDesk", "Oct 1, 2025", "Sep 30, 2026", "Renewal", "Sep 15, 2026", "12"],
];

export const vendors = [
  ["NorthStar Parcel", "Logistics", "$4.84M", "$91,320", "$24,180", "2", "184", "78"],
  ["Nimbus Cloud", "Technology", "$3.21M", "$68,400", "$17,220", "3", "36", "62"],
  ["Veridian Wireless", "Telecom", "$1.12M", "$43,810", "$13,400", "4", "52", "81"],
  ["DataDesk", "SaaS", "$688K", "$71,290", "$14,910", "2", "12", "48"],
  ["Rapid 3PL", "Supply Chain", "$1.44M", "$39,200", "$11,880", "1", "24", "71"],
];

export const documents = [
  ["NSP_Invoice_884103.pdf", "Invoice", "NorthStar Parcel", "Complete", "Sep 10, 2026 · 09:42", "18 pages"],
  ["Parcel_Rate_Card_2026.xlsx", "Rate sheet", "NorthStar Parcel", "Complete", "Sep 10, 2026 · 09:38", "1,204 rows"],
  ["August_BOL_Export.csv", "Operational data", "NorthStar Parcel", "Auditing", "Sep 10, 2026 · 09:35", "8,440 rows"],
  ["Cloud_Commitment_Order.pdf", "Contract", "Nimbus Cloud", "Needs Review", "Sep 9, 2026 · 16:12", "12 pages"],
  ["Mobility_Inventory.xlsx", "Usage export", "Veridian Wireless", "Matching", "Sep 8, 2026 · 11:08", "2,108 rows"],
];

export const activity = [
  ["$6,129 credit approved", "NorthStar Parcel", "2 min"],
  ["14 findings verified", "AI Spend", "18 min"],
  ["$8,440 future spend prevented", "DataDesk renewal", "42 min"],
  ["3 files completed extraction", "Rapid 3PL", "1 hr"],
  ["$11,880 claim submitted", "Rapid 3PL", "2 hr"],
];

export const trend = [32, 40, 37, 51, 58, 54, 68, 74, 83, 79, 92, 104];

export const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
