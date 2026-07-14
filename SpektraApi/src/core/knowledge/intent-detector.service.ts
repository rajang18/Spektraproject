export interface IntentDetectionResult {
  isProjectRelated: boolean;
  confidence: number;
  reason: string;
}

const PROJECT_TERMS = [
  'bug',
  'fix',
  'error',
  'exception',
  'stack',
  'trace',
  'api',
  'endpoint',
  'route',
  'service',
  'controller',
  'component',
  'module',
  'class',
  'function',
  'method',
  'database',
  'query',
  'auth',
  'token',
  'build',
  'test',
  'refactor',
  'issue',
  'log',
  'implementation',
  'code',
  '.ts',
  '.js',
  '.java',
  '.cs',
  '.py'
];

const GENERAL_TERMS = ['poem', 'weather', 'recipe', 'movie', 'travel', 'joke', 'math puzzle'];

export class IntentDetector {
  detect(question: string): IntentDetectionResult {
    const lower = question.toLowerCase();

    if (GENERAL_TERMS.some((term) => lower.includes(term))) {
      return {
        isProjectRelated: false,
        confidence: 0.15,
        reason: 'Detected clearly general-purpose query.'
      };
    }

    const termHits = PROJECT_TERMS.reduce((count, term) => count + (lower.includes(term) ? 1 : 0), 0);
    const hasPathHint = /[a-z0-9_-]+\/[a-z0-9_./-]+/i.test(lower);
    const confidence = Math.min(0.3 + termHits * 0.1 + (hasPathHint ? 0.2 : 0), 0.95);
    const isProjectRelated = termHits > 0 || hasPathHint || lower.split(/\s+/).length >= 6;

    return {
      isProjectRelated,
      confidence,
      reason: isProjectRelated
        ? `Matched ${termHits} engineering terms${hasPathHint ? ' with file path hints' : ''}.`
        : 'No project-specific terms found.'
    };
  }
}

export const intentDetector = new IntentDetector();
