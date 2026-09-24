/**
 * SDD 4-Dimensional Quality Rubric Engine
 * Evaluates deliverables on 0 to 9 scale against a strict >= 8.5 approval threshold.
 * 
 * Dimensions:
 * 1. Pertinence with Requirements & User Goal: 0 - 2.5 pts
 * 2. Scientific Rigor & CS Standards (Clean Code/SOLID): 0 - 2.5 pts
 * 3. Clarity, Coherence & Visual Structure: 0 - 2.0 pts
 * 4. Lexical Originality & Zero AI Clichés: 0 - 2.0 pts
 * 
 * @spec SPEC-001
 */

export interface RubricDimensions {
  pertinence: number;         // Max 2.5
  scientificRigor: number;    // Max 2.5
  clarityStructure: number;   // Max 2.0
  originalityLexicon: number; // Max 2.0
}

export interface EvaluationReport {
  score: number;
  passed: boolean;
  threshold: number;
  dimensions: RubricDimensions;
  clichesPenalty: number;
  observations: string[];
}

export const SDD_THRESHOLD = 8.5;

export function evaluateDeliverable(
  dimensions: RubricDimensions,
  clichePenalty: number = 0,
  observations: string[] = []
): EvaluationReport {
  // Clamp dimensions to their maximum allowed bounds
  const clamped: RubricDimensions = {
    pertinence: Math.max(0, Math.min(2.5, dimensions.pertinence)),
    scientificRigor: Math.max(0, Math.min(2.5, dimensions.scientificRigor)),
    clarityStructure: Math.max(0, Math.min(2.0, dimensions.clarityStructure)),
    originalityLexicon: Math.max(0, Math.min(2.0, dimensions.originalityLexicon))
  };

  const rawSum = clamped.pertinence + clamped.scientificRigor + clamped.clarityStructure + clamped.originalityLexicon;
  const netScore = Math.max(0, Math.min(9.0, Number((rawSum - clichePenalty).toFixed(2))));
  const passed = netScore >= SDD_THRESHOLD;

  return {
    score: netScore,
    passed,
    threshold: SDD_THRESHOLD,
    dimensions: clamped,
    clichesPenalty: Number(clichePenalty.toFixed(2)),
    observations
  };
}
