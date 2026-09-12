type StatusBadgeProps = {
  children: React.ReactNode;
  tone?: "good" | "warn" | "risk" | "neutral" | "info";
};

const good = new Set(["Recovered", "Approved", "Complete", "Active", "Connected", "Verified"]);
const warn = new Set(["Reviewing", "Needs Review", "Renewal", "Matching", "Auditing", "Vendor Reviewing"]);
const risk = new Set(["Rejected", "Failed", "Critical"]);
const info = new Set(["Submitted", "Claim Ready", "Available"]);

export function StatusBadge({ children, tone }: StatusBadgeProps) {
  const label = typeof children === "string" ? children : "";
  const resolved =
    tone ??
    (good.has(label)
      ? "good"
      : warn.has(label)
        ? "warn"
        : risk.has(label)
          ? "risk"
          : info.has(label)
            ? "info"
            : "neutral");

  return <span className={`status-badge ${resolved}`}>{children}</span>;
}
