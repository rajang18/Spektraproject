import { openAiService } from '../openai/openai.service.js';
import { ChatAnswer, ProjectSearchResult } from './project-knowledge.types.js';

function extractRelatedComponents(searchResult: ProjectSearchResult): string[] {
  return [...new Set(searchResult.hits.map((hit) => hit.chunk.metadata.componentName).filter((v): v is string => !!v))].slice(0, 10);
}

export class ResponseGenerator {
  async generateProjectAnswer(input: {
    projectName: string;
    question: string;
    context: string;
    searchResult: ProjectSearchResult;
    conversationSummary: string;
    confidence: number;
  }): Promise<ChatAnswer> {
    const answerText = await openAiService.generateText({
      systemPrompt:
        'You are a senior project engineering copilot for the currently indexed codebase. Answer strictly from provided project context. If context is limited, say so clearly but still provide best effort analysis from retrieved files. Always mention concrete file paths and methods in the explanation.',
      userPrompt: [
        `Project: ${input.projectName}`,
        `Question: ${input.question}`,
        `Intent confidence: ${input.confidence}`,
        `Conversation context:\n${input.conversationSummary}`,
        input.context,
        'Return concise technical answer with execution flow and references.'
      ].join('\n\n'),
      temperature: 0.1
    });

    const filesUsed = input.searchResult.hits.map((hit) => ({
      path: hit.chunk.relativePath,
      score: Number(hit.combinedScore.toFixed(4)),
      chunk: `${hit.chunk.startLine}-${hit.chunk.endLine}`
    }));

    const relevantCode = input.searchResult.hits.slice(0, 6).map((hit) => ({
      path: hit.chunk.relativePath,
      startLine: hit.chunk.startLine,
      endLine: hit.chunk.endLine,
      code: hit.chunk.content
    }));

    return {
      mode: 'c3',
      summary: `${input.projectName}: answer generated from ${input.searchResult.hits.length} retrieved chunks across ${new Set(filesUsed.map((f) => f.path)).size} files.`,
      answer: answerText,
      explanation: 'Hybrid retrieval (semantic + keyword) selected top-ranked chunks and passed only those to the LLM.',
      filesUsed,
      relevantCode,
      executionFlow: [
        `Intent detector marked request as project-related (${input.projectName})`,
        'Project source index verified/refreshed from zip',
        'Hybrid retrieval selected relevant chunks',
        'LLM generated explanation from retrieved context'
      ],
      relatedComponents: extractRelatedComponents(input.searchResult),
      confidence: Number(input.confidence.toFixed(2)),
      suggestedFollowUps: [
        'Show complete file for top hit',
        'Explain service-to-component call flow',
        'Trace API endpoint used by this feature'
      ],
      search: {
        semanticHits: input.searchResult.hits.filter((h) => h.semanticScore > 0).length,
        keywordHits: input.searchResult.hits.filter((h) => h.keywordScore > 0).length,
        retrievedChunks: input.searchResult.hits.length
      }
    };
  }

  async generateGeneralAnswer(question: string): Promise<ChatAnswer> {
    const answerText = await openAiService.generateText({
      systemPrompt: 'You are a helpful senior software engineering assistant.',
      userPrompt: question,
      temperature: 0.2
    });

    return {
      mode: 'general',
      summary: 'General LLM response (query not classified as C3-specific).',
      answer: answerText,
      explanation: 'No C3 retrieval context was used.',
      filesUsed: [],
      relevantCode: [],
      executionFlow: ['Intent detector marked request as non-project', 'Generated general response from LLM knowledge'],
      relatedComponents: [],
      confidence: 0.5,
      suggestedFollowUps: ['Ask a project-specific question to use retrieval from your uploaded zip'],
      search: {
        semanticHits: 0,
        keywordHits: 0,
        retrievedChunks: 0
      }
    };
  }
}

export const responseGenerator = new ResponseGenerator();
