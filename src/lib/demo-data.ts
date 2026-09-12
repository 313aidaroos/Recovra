export const headline = {
  monitored: 18420319,
  found: 746210,
  verified: 574892,
  recovered: 481904,
  prevented: 182640,
  pending: 81666,
};

export const opportunities = [
  { vendor:"NorthStar Parcel", module:"Logistics", issue:"Fuel surcharge above contracted table", amount:24180, confidence:98, status:"Claim ready" },
  { vendor:"Nimbus AI", module:"AI Spend", issue:"Unused enterprise seats + unclaimed credits", amount:18740, confidence:94, status:"Review" },
  { vendor:"CloudForge", module:"Cloud", issue:"Idle compute + commitment underutilization", amount:16220, confidence:92, status:"Verified" },
  { vendor:"DataDesk", module:"SaaS", issue:"126 inactive licenses after roster change", amount:14910, confidence:99, status:"Claim ready" },
  { vendor:"Rapid 3PL", module:"3PL", issue:"Storage billed above pallet-day inventory", amount:11880, confidence:96, status:"Submitted" },
];

export const activity = [
  ["$6,129", "credit approved", "NorthStar Parcel", "2 min"],
  ["14", "new findings verified", "AI Spend", "18 min"],
  ["$8,440", "future spend prevented", "SaaS renewal", "42 min"],
  ["3 files", "finished extraction", "Rapid 3PL", "1 hr"],
  ["$11,280", "claim submitted", "CloudForge", "2 hr"],
];

export const trend = [34, 42, 39, 58, 64, 62, 78, 83, 91, 88, 104, 119];
