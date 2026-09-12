import { compareDecimal } from "./money";
import type { Severity } from "./types";

export function severityForVariance(variance: string): Severity {
  if (compareDecimal(variance, "10000") >= 0) return "critical";
  if (compareDecimal(variance, "1000") >= 0) return "high";
  if (compareDecimal(variance, "100") >= 0) return "medium";
  return "low";
}
