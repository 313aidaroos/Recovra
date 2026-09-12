import type { ChargeDimensions, ChargeLine, ContractTerm, ContractTermType } from "./types";

export const MATCH_DIMENSIONS = ["mode", "origin", "destination", "equipment", "service_level"] as const;

export function normalizeCode(value: string | null | undefined): string {
  return (value ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
}

export function normalizeDimensionValue(value: string | null | undefined): string {
  return (value ?? "").trim().toUpperCase();
}

export function termKey(chargeCode: string, dimensions: ChargeDimensions): string {
  return [chargeCode, ...MATCH_DIMENSIONS.map((dimension) => normalizeDimensionValue(dimensions[dimension]) || "*")].join("|");
}

/**
 * Picks the most specific contract term for a charge line.
 * A term dimension that is empty acts as a wildcard; a non-empty dimension must equal the line's.
 * Specificity = number of non-wildcard dimensions matched. Ties resolve by termId for determinism.
 */
export function matchTerm(terms: ContractTerm[], line: ChargeLine, termTypes: ContractTermType[]): ContractTerm | null {
  const code = normalizeCode(line.chargeCode);
  let best: { term: ContractTerm; score: number } | null = null;

  for (const term of terms) {
    if (!termTypes.includes(term.termType)) continue;
    if (normalizeCode(term.chargeCode) !== code) continue;

    let score = 0;
    let compatible = true;
    for (const dimension of MATCH_DIMENSIONS) {
      const wanted = normalizeDimensionValue(term.dimensions[dimension]);
      if (!wanted) continue;
      if (wanted !== normalizeDimensionValue(line.dimensions[dimension])) {
        compatible = false;
        break;
      }
      score += 1;
    }
    if (!compatible) continue;
    if (!best || score > best.score || (score === best.score && term.termId < best.term.termId)) {
      best = { term, score };
    }
  }

  return best?.term ?? null;
}

export function hasAnyTermForCode(terms: ContractTerm[], chargeCode: string): boolean {
  const code = normalizeCode(chargeCode);
  return terms.some((term) => normalizeCode(term.chargeCode) === code);
}
