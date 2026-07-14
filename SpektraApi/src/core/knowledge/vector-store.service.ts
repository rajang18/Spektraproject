import { embeddingService } from './embedding.service.js';
import { ProjectChunk } from './project-knowledge.types.js';

export class VectorStore {
  search(query: string, chunks: ProjectChunk[], topK: number): Array<{ chunk: ProjectChunk; score: number }> {
    const queryEmbedding = embeddingService.embed(query);

    return chunks
      .map((chunk) => ({
        chunk,
        score: embeddingService.similarity(queryEmbedding, chunk.embedding)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

export const vectorStore = new VectorStore();
