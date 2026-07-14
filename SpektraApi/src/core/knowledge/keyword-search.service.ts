import { ProjectChunk } from './project-knowledge.types.js';

const STOP_WORDS = new Set([
  'the',
  'this',
  'that',
  'with',
  'from',
  'into',
  'your',
  'where',
  'what',
  'show',
  'explain',
  'how',
  'does',
  'which',
  'file',
  'files',
  'component',
  'service',
  'module'
]);

function extractTerms(text: string): string[] {
  return [...new Set((text.toLowerCase().match(/[a-z0-9_/-]{3,}/g) ?? []).filter((token) => !STOP_WORDS.has(token)))];
}

export class KeywordSearch {
  search(query: string, chunks: ProjectChunk[], limit = 12): Array<{ chunk: ProjectChunk; score: number }> {
    const terms = extractTerms(query);
    if (terms.length === 0) {
      return [];
    }

    const regexMode = this.tryParseRegex(query);

    const ranked = chunks
      .map((chunk) => {
        let score = 0;
        const lowerContent = chunk.content.toLowerCase();
        const lowerPath = chunk.relativePath.toLowerCase();

        if (regexMode && regexMode.test(chunk.content)) {
          score += 10;
        }

        for (const term of terms) {
          if (lowerPath.includes(term)) {
            score += 4;
          }

          const matches = lowerContent.split(term).length - 1;
          score += Math.min(matches, 6);

          if (chunk.metadata.classNames.some((className) => className.toLowerCase().includes(term))) {
            score += 4;
          }

          if (chunk.metadata.functions.some((fn) => fn.toLowerCase().includes(term))) {
            score += 3;
          }
        }

        return { chunk, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return ranked;
  }

  private tryParseRegex(query: string): RegExp | null {
    const trimmed = query.trim();
    if (!trimmed.startsWith('/') || trimmed.lastIndexOf('/') <= 0) {
      return null;
    }

    const lastSlash = trimmed.lastIndexOf('/');
    const body = trimmed.slice(1, lastSlash);
    const flags = trimmed.slice(lastSlash + 1);
    if (!body) {
      return null;
    }

    try {
      return new RegExp(body, flags || 'i');
    } catch {
      return null;
    }
  }
}

export const keywordSearch = new KeywordSearch();
