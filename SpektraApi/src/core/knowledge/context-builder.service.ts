import { ProjectSearchResult } from './project-knowledge.types.js';

// Hard ceiling on total assembled context, independent of per-chunk caps or
// hit count. This is the last line of defense against sending a runaway
// prompt to the LLM regardless of what upstream retrieval selected.
const MAX_CONTEXT_CHARACTERS = 60000;

export class ContextBuilder {
  build(searchResult: ProjectSearchResult): string {
    const sections: string[] = [
      'PROJECT RETRIEVAL CONTEXT',
      `Query: ${searchResult.query}`,
      `Mode: ${searchResult.mode}`,
      `Total chunks scanned: ${searchResult.totalChunksScanned}`,
      `Chunks selected: ${searchResult.hits.length}`
    ];

    let usedCharacters = sections.join('\n\n').length;
    let includedCount = 0;

    for (const hit of searchResult.hits) {
      const section = [
        `FILE: ${hit.chunk.relativePath}`,
        `LINES: ${hit.chunk.startLine}-${hit.chunk.endLine}`,
        `SCORES: semantic=${hit.semanticScore.toFixed(4)}, keyword=${hit.keywordScore.toFixed(4)}, combined=${hit.combinedScore.toFixed(4)}`,
        `SUMMARY: ${hit.chunk.metadata.featureSummary}`,
        'CODE:',
        hit.chunk.content
      ].join('\n');

      if (usedCharacters + section.length > MAX_CONTEXT_CHARACTERS) {
        break;
      }

      sections.push(section);
      usedCharacters += section.length;
      includedCount += 1;
    }

    if (includedCount < searchResult.hits.length) {
      sections.push(
        `NOTE: ${searchResult.hits.length - includedCount} additional retrieved chunk(s) omitted to stay within the context size budget.`
      );
    }

    return sections.join('\n\n');
  }
}

export const contextBuilder = new ContextBuilder();
