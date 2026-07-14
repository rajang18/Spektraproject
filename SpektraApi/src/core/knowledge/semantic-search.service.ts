import { ProjectChunk } from './project-knowledge.types.js';
import { vectorStore } from './vector-store.service.js';

export class SemanticSearch {
  search(query: string, chunks: ProjectChunk[], limit = 12): Array<{ chunk: ProjectChunk; score: number }> {
    return vectorStore.search(query, chunks, limit);
  }
}

export const semanticSearch = new SemanticSearch();
