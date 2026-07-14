import { keywordSearch } from './keyword-search.service.js';
import { semanticSearch } from './semantic-search.service.js';
import { ProjectChunk, ProjectSearchResult, SearchHit, SearchMode } from './project-knowledge.types.js';

function mergeHits(
  semantic: Array<{ chunk: ProjectChunk; score: number }>,
  keyword: Array<{ chunk: ProjectChunk; score: number }>,
  mode: SearchMode
): SearchHit[] {
  const map = new Map<string, SearchHit>();

  semantic.forEach((item) => {
    map.set(item.chunk.id, {
      chunk: item.chunk,
      semanticScore: item.score,
      keywordScore: 0,
      combinedScore: item.score
    });
  });

  keyword.forEach((item) => {
    const existing = map.get(item.chunk.id);
    if (existing) {
      existing.keywordScore = item.score;
      existing.combinedScore = mode === 'hybrid' ? existing.semanticScore * 0.6 + existing.keywordScore * 0.4 : item.score;
      return;
    }

    map.set(item.chunk.id, {
      chunk: item.chunk,
      semanticScore: 0,
      keywordScore: item.score,
      combinedScore: mode === 'hybrid' ? item.score * 0.4 : item.score
    });
  });

  return [...map.values()].sort((a, b) => b.combinedScore - a.combinedScore);
}

export class ProjectRetriever {
  retrieve(query: string, chunks: ProjectChunk[], mode: SearchMode = 'hybrid', limit = 10): ProjectSearchResult {
    const semanticHits = mode === 'keyword' ? [] : semanticSearch.search(query, chunks, Math.max(limit * 2, 16));
    const keywordHits = mode === 'semantic' ? [] : keywordSearch.search(query, chunks, Math.max(limit * 2, 16));

    const merged = mergeHits(semanticHits, keywordHits, mode).slice(0, limit);

    return {
      query,
      mode,
      hits: merged,
      totalChunksScanned: chunks.length
    };
  }
}

export const projectRetriever = new ProjectRetriever();
