import { ProjectChunk, SearchHit } from './project-knowledge.types.js';
import { extractTerms } from './keyword-search.service.js';

// Existence/negation questions ("is there anywhere...", "do we ever...") need
// every literal match across the whole index, not a top-K hybrid ranking —
// a single precise hit (e.g. one call site) can otherwise be outscored by
// several loosely-related chunks that happen to share more surface terms.
export class ExhaustiveSearch {
  search(query: string, chunks: ProjectChunk[], limit = 40): SearchHit[] {
    const terms = extractTerms(query);
    if (terms.length === 0) {
      return [];
    }

    const hits: SearchHit[] = [];

    for (const chunk of chunks) {
      const lowerContent = chunk.content.toLowerCase();
      const lowerPath = chunk.relativePath.toLowerCase();
      const matchedTermCount = terms.reduce((count, term) => {
        const inContent = lowerContent.includes(term);
        const inPath = lowerPath.includes(term);
        return count + (inContent || inPath ? 1 : 0);
      }, 0);

      if (matchedTermCount > 0) {
        hits.push({
          chunk,
          semanticScore: 0,
          keywordScore: matchedTermCount,
          combinedScore: matchedTermCount
        });
      }
    }

    return hits.sort((a, b) => b.combinedScore - a.combinedScore).slice(0, limit);
  }
}

export const exhaustiveSearch = new ExhaustiveSearch();
