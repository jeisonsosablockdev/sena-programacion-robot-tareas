/**
 * Anti-Cliché Lexical Heuristic Filter
 * Detects generic LLM buzzwords, throat-clearing, and robotic corporate filler.
 * 
 * @spec SPEC-001
 */

export interface BannedRule {
  pattern: RegExp;
  phrase: string;
  penalty: number;
}

export interface DetectedCliche {
  phrase: string;
  count: number;
  penalty: number;
}

export interface ClicheScanResult {
  hasCliches: boolean;
  detected: DetectedCliche[];
  totalPenalty: number;
  cleanScore: number; // Max 2.0 minus total penalty
}

export const BANNED_PATTERNS: BannedRule[] = [
  // Spanish throat-clearing and filler
  { pattern: /\ben resumen\b/gi, phrase: 'en resumen', penalty: 0.5 },
  { pattern: /\ben conclusi[oó]n\b/gi, phrase: 'en conclusión', penalty: 0.5 },
  { pattern: /\bpara concluir\b/gi, phrase: 'para concluir', penalty: 0.5 },
  { pattern: /\ben definitiva\b/gi, phrase: 'en definitiva', penalty: 0.5 },
  { pattern: /\bes importante (destacar|mencionar|recalcar|señalar|notar)\b/gi, phrase: 'es importante destacar/mencionar', penalty: 0.5 },
  { pattern: /\bcabe (destacar|resaltar|mencionar|señalar)\b/gi, phrase: 'cabe destacar/resaltar', penalty: 0.5 },
  { pattern: /\bes crucial (destacar|mencionar|resaltar)\b/gi, phrase: 'es crucial destacar', penalty: 0.5 },
  { pattern: /\ben el (vertiginoso|cambiante|competitivo) mundo\b/gi, phrase: 'en el vertiginoso/cambiante mundo', penalty: 0.5 },
  { pattern: /\ben un mundo cada vez m[aá]s\b/gi, phrase: 'en un mundo cada vez más', penalty: 0.5 },
  { pattern: /\bun papel (crucial|fundamental|vital|clave)\b/gi, phrase: 'un papel crucial/fundamental', penalty: 0.5 },
  { pattern: /\bjuega un (papel|rol) (crucial|fundamental|vital|clave)\b/gi, phrase: 'juega un papel/rol crucial', penalty: 0.5 },
  { pattern: /\ba la vanguardia\b/gi, phrase: 'a la vanguardia', penalty: 0.4 },
  { pattern: /\bcambio de paradigma\b/gi, phrase: 'cambio de paradigma', penalty: 0.4 },
  { pattern: /\bsumerg[ií]rse en\b/gi, phrase: 'sumergirse en', penalty: 0.4 },
  { pattern: /\badentr[eé]monos en\b/gi, phrase: 'adentrémonos en', penalty: 0.4 },
  { pattern: /\ben este art[ií]culo\b/gi, phrase: 'en este artículo', penalty: 0.3 },
  { pattern: /\ben este post\b/gi, phrase: 'en este post', penalty: 0.3 },
  { pattern: /\bsin duda alguna\b/gi, phrase: 'sin duda alguna', penalty: 0.4 },
  { pattern: /\bno cabe duda\b/gi, phrase: 'no cabe duda', penalty: 0.4 },

  // English equivalents
  { pattern: /\bin conclusion\b/gi, phrase: 'in conclusion', penalty: 0.5 },
  { pattern: /\bit is important to note\b/gi, phrase: 'it is important to note', penalty: 0.5 },
  { pattern: /\bit is worth noting\b/gi, phrase: 'it is worth noting', penalty: 0.5 },
  { pattern: /\bin today's (fast-paced|dynamic) world\b/gi, phrase: "in today's fast-paced world", penalty: 0.5 },
  { pattern: /\bplays a (crucial|vital|pivotal) role\b/gi, phrase: 'plays a crucial role', penalty: 0.5 },
  { pattern: /\bdelve into\b/gi, phrase: 'delve into', penalty: 0.4 },
  { pattern: /\bdive deep into\b/gi, phrase: 'dive deep into', penalty: 0.4 }
];

export function scanCliches(text: string): ClicheScanResult {
  const detected: DetectedCliche[] = [];
  let totalPenalty = 0;

  for (const rule of BANNED_PATTERNS) {
    const matches = text.match(rule.pattern);
    if (matches && matches.length > 0) {
      const penalty = Number((matches.length * rule.penalty).toFixed(2));
      detected.push({
        phrase: rule.phrase,
        count: matches.length,
        penalty
      });
      totalPenalty += penalty;
    }
  }

  totalPenalty = Number(totalPenalty.toFixed(2));
  const cleanScore = Math.max(0, Number((2.0 - totalPenalty).toFixed(2)));

  return {
    hasCliches: detected.length > 0,
    detected,
    totalPenalty,
    cleanScore
  };
}
