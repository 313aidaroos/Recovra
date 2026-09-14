/** Display-only formatting. Billing math lives in the recovery engine's fixed-point helpers. */

export function formatMoney(amount: string | number | null | undefined, currency = "USD", options: { cents?: boolean } = {}) {
  if (amount === null || amount === undefined || amount === "") return "—";
  const value = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(value)) return String(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: options.cents ? 2 : 0,
    minimumFractionDigits: options.cents ? 2 : 0,
  }).format(value);
}

export function formatCompactMoney(amount: string | number | null | undefined, currency = "USD") {
  const value = typeof amount === "number" ? amount : Number(amount ?? 0);
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function formatPercent(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "—";
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return "—";
  return `${Math.round(number * 100)}%`;
}

export function initials(name: string, fallback = "R") {
  const parts = name.trim().split(/[\s@._-]+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || fallback;
}

export function titleCase(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatNumber(value: number | string | null | undefined) {
  const number = typeof value === "number" ? value : Number(value ?? 0);
  return new Intl.NumberFormat("en-US").format(Number.isFinite(number) ? number : 0);
}
