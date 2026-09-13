import type { RuleFinding } from "@/lib/recovery-engine";

export type SourceExtraction = { method: "ai"; provider: string; model: string; confidence: string; extractedAt: string };

/**
 * Findings computed from rows a model transcribed out of a PDF inherit that read confidence and
 * stay "needs review" until a person compares the rows with the source. The variance arithmetic
 * itself is unchanged and still deterministic; only the trust level is reduced.
 */
export function applySourceExtractionLimits(findings: RuleFinding[], extraction: SourceExtraction | null): RuleFinding[] {
  if (!extraction) return findings;
  const cap = Number(extraction.confidence);
  return findings.map((finding) => {
    const ruleConfidence = Number(finding.confidence);
    const capped = Number.isFinite(cap) ? Math.min(ruleConfidence, cap) : ruleConfidence;
    return {
      ...finding,
      confidence: capped.toFixed(4),
      recoverability: "needs_review",
      explanation: `${finding.explanation} Source rows were transcribed from a PDF by ${extraction.provider}/${extraction.model} (read confidence ${Math.round(cap * 100)}%); verify them against the document before submitting a claim.`,
      calculationTrace: { ...finding.calculationTrace, sourceExtraction: { ...extraction, humanVerificationRequired: true, confidenceCapApplied: capped < ruleConfidence } },
    };
  });
}
