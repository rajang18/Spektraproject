// Flags questions that assert or ask about an exhaustive fact across the
// WHOLE codebase ("is there any API call anywhere", "do we ever...", "is it
// only saved locally"). These can't be answered reliably from a small top-K
// retrieval sample — a single narrow match elsewhere in the codebase can
// flip the answer, so they need an exhaustive scan instead.
const EXISTENCE_QUANTIFIER_PATTERNS: RegExp[] = [
  /\bany\b/i,
  /\banywhere\b/i,
  /\bever\b/i,
  /\bonly\b/i,
  /\bnever\b/i,
  /\balways\b/i,
  /\bat all\b/i,
  /\bexist(s|ing)?\b/i
];

export class ExistenceQueryDetector {
  isExistenceQuery(question: string): boolean {
    return EXISTENCE_QUANTIFIER_PATTERNS.some((pattern) => pattern.test(question));
  }
}

export const existenceQueryDetector = new ExistenceQueryDetector();
