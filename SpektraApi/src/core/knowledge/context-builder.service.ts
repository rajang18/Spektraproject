import { ProjectSearchResult } from './project-knowledge.types.js';

export class ContextBuilder {
  build(searchResult: ProjectSearchResult): string {
    const sections: string[] = [
      'PROJECT RETRIEVAL CONTEXT',
      `Query: ${searchResult.query}`,
      `Mode: ${searchResult.mode}`,
      `Total chunks scanned: ${searchResult.totalChunksScanned}`,
      `Chunks selected: ${searchResult.hits.length}`
    ];

    for (const hit of searchResult.hits) {
      sections.push(
        [
          `FILE: ${hit.chunk.relativePath}`,
          `LINES: ${hit.chunk.startLine}-${hit.chunk.endLine}`,
          `SCORES: semantic=${hit.semanticScore.toFixed(4)}, keyword=${hit.keywordScore.toFixed(4)}, combined=${hit.combinedScore.toFixed(4)}`,
          `SUMMARY: ${hit.chunk.metadata.featureSummary}`,
          'CODE:',
          hit.chunk.content
        ].join('\n')
      );
    }

    return sections.join('\n\n');
  }
}

export const contextBuilder = new ContextBuilder();
