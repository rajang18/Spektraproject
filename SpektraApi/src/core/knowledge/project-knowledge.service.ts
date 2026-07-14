import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { logger } from '../../config/logger.js';
import { AppError } from '../errors/app-error.js';
import { contextBuilder } from './context-builder.service.js';
import { conversationMemory } from './conversation-memory.service.js';
import { existenceQueryDetector } from './existence-query-detector.service.js';
import { exhaustiveSearch } from './exhaustive-search.service.js';
import { intentDetector } from './intent-detector.service.js';
import { ProjectIndexer, projectIndexer } from './project-indexer.service.js';
import { ChatAnswer, ConversationHistory, ConversationSummary, ProjectChunk, ProjectSearchResult, ProjectStatus, SearchMode } from './project-knowledge.types.js';
import { projectRetriever } from './project-retriever.service.js';
import { responseGenerator } from './response-generator.service.js';
import { zipManager } from './zip-manager.service.js';

const EXHAUSTIVE_SEARCH_LIMIT = 40;

export class ProjectKnowledgeService {
  constructor(private readonly indexer: ProjectIndexer = projectIndexer) {}

  async chat(question: string, conversationId: string): Promise<ChatAnswer> {
    const detection = intentDetector.detect(question);

    if (!detection.isProjectRelated) {
      const answer = await responseGenerator.generateGeneralAnswer(question);
      conversationMemory.append(conversationId, {
        question,
        answer: answer.answer,
        filesUsed: answer.filesUsed.map((f) => ({ path: f.path, score: f.score })),
        timestamp: new Date().toISOString()
      });
      return answer;
    }

    const index = this.indexer.ensureIndexed();
    const explicitFilePath = this.extractRequestedFilePath(question);
    if (explicitFilePath) {
      const resolved = this.resolveIndexedPath(index, explicitFilePath);
      if (resolved) {
        const file = this.code(explicitFilePath);
        const language = this.toLanguageHint(resolved.displayPath);
        const answer: ChatAnswer = {
          mode: 'c3',
          summary: `Direct file preview returned for ${resolved.displayPath}.`,
          answer: [
            `Here is the exact file content for ${resolved.displayPath}:`,
            '',
            `\`\`\`${language}`,
            file.content,
            '\`\`\`'
          ].join('\n').replaceAll('\\`', '`'),
          explanation: 'Detected an explicit file-path request and returned deterministic file content from indexed source.',
          filesUsed: [{ path: resolved.displayPath, score: 1, chunk: '1-full' }],
          relevantCode: [{ path: resolved.displayPath, startLine: 1, endLine: file.content.split(/\r?\n/).length, code: file.content }],
          executionFlow: [
            'Detected explicit file path in prompt',
            'Resolved path against indexed project files',
            'Read full file content and returned deterministic preview'
          ],
          relatedComponents: [],
          confidence: 0.98,
          suggestedFollowUps: ['Explain this file line-by-line', 'Show imports and dependencies for this file'],
          search: {
            semanticHits: 0,
            keywordHits: 1,
            retrievedChunks: 1
          }
        };

        conversationMemory.append(conversationId, {
          question,
          answer: answer.answer,
          filesUsed: [{ path: resolved.displayPath, score: 1 }],
          timestamp: new Date().toISOString()
        });

        return answer;
      }
    }

    const search = this.retrieveForQuestion(question, index.chunks, 10);
    const context = contextBuilder.build(search);
    const conversationSummary = conversationMemory.summarizeForPrompt(conversationId);

    const answer = await responseGenerator.generateProjectAnswer({
      projectName: index.projectName,
      question,
      context,
      searchResult: search,
      conversationSummary,
      confidence: detection.confidence
    });

    const normalizedAnswer: ChatAnswer = {
      ...answer,
      filesUsed: answer.filesUsed.map((item) => ({
        ...item,
        path: this.toDisplayPath(item.path)
      })),
      relevantCode: answer.relevantCode.map((item) => ({
        ...item,
        path: this.toDisplayPath(item.path)
      }))
    };

    conversationMemory.append(conversationId, {
      question,
      answer: normalizedAnswer.answer,
      filesUsed: normalizedAnswer.filesUsed.map((f) => ({ path: f.path, score: f.score })),
      timestamp: new Date().toISOString()
    });

    return normalizedAnswer;
  }

  search(query: string, mode: SearchMode = 'hybrid', limit = 12): ProjectSearchResult {
    const index = this.indexer.ensureIndexed();

    if (mode === 'exhaustive') {
      return {
        query,
        mode: 'exhaustive',
        hits: exhaustiveSearch.search(query, index.chunks, limit),
        totalChunksScanned: index.chunks.length
      };
    }

    return projectRetriever.retrieve(query, index.chunks, mode, limit);
  }

  async explain(query: string, conversationId: string): Promise<ChatAnswer> {
    const index = this.indexer.ensureIndexed();
    const search = this.retrieveForQuestion(query, index.chunks, 12);
    const context = contextBuilder.build(search);
    const conversationSummary = conversationMemory.summarizeForPrompt(conversationId);

    return responseGenerator.generateProjectAnswer({
      projectName: index.projectName,
      question: `Explain: ${query}`,
      context,
      searchResult: search,
      conversationSummary,
      confidence: 0.85
    });
  }

  code(filePath: string): { path: string; content: string } {
    const index = this.indexer.ensureIndexed();
    const resolved = this.resolveIndexedPath(index, filePath);
    if (!resolved) {
      throw new AppError(`File not found in index: ${filePath}`, 404, 'PROJECT_FILE_NOT_FOUND');
    }

    const fullPath = join(this.indexer.getRepoRoot(), resolved.indexPath);
    try {
      return {
        path: resolved.displayPath,
        content: readFileSync(fullPath, 'utf8')
      };
    } catch {
      throw new AppError(`Unable to read file content: ${filePath}`, 404, 'PROJECT_FILE_READ_FAILED');
    }
  }

  index(): ProjectStatus {
    const indexed = this.indexer.reindex(false);
    return this.buildStatus(indexed.files.length, indexed.chunks.length, indexed.indexedAt, indexed.zipSignature);
  }

  reindex(): ProjectStatus {
    const indexed = this.indexer.reindex(true);
    return this.buildStatus(indexed.files.length, indexed.chunks.length, indexed.indexedAt, indexed.zipSignature);
  }

  status(): ProjectStatus {
    const zipPath = zipManager.getZipPath();
    const index = this.indexer.readIndex();
    return this.buildStatus(index?.files.length ?? 0, index?.chunks.length ?? 0, index?.indexedAt ?? null, index?.zipSignature ?? null, zipPath);
  }

  zips() {
    return zipManager.listZipFiles();
  }

  selectZip(zipFileName: string): ProjectStatus {
    zipManager.setActiveZip(zipFileName);
    const indexed = this.indexer.reindex(true);
    return this.buildStatus(indexed.files.length, indexed.chunks.length, indexed.indexedAt, indexed.zipSignature);
  }

  files(): Array<{ path: string; summary: string; extension: string }> {
    const index = this.indexer.ensureIndexed();
    return index.files.map((file) => ({
      path: this.toDisplayPath(file.relativePath),
      summary: file.featureSummary,
      extension: file.extension
    }));
  }

  features(): Array<{ module: string; files: number }> {
    const index = this.indexer.ensureIndexed();
    const moduleMap = new Map<string, number>();

    for (const file of index.files) {
      const match = file.relativePath.match(/src\/app\/modules\/([^/]+)/);
      const moduleName = match?.[1] ?? 'shared-or-root';
      moduleMap.set(moduleName, (moduleMap.get(moduleName) ?? 0) + 1);
    }

    return [...moduleMap.entries()]
      .map(([module, files]) => ({ module, files }))
      .sort((a, b) => b.files - a.files);
  }

  listConversations(limit = 50): ConversationSummary[] {
    return conversationMemory.listConversations(limit);
  }

  getConversationHistory(conversationId: string): ConversationHistory {
    return conversationMemory.getConversation(conversationId);
  }

  // Existence/negation questions ("is there any API call anywhere", "do we
  // ever...") can't be trusted to a top-10 hybrid ranking: a single precise
  // match can be outscored by several loosely-related chunks. For those,
  // scan every indexed chunk instead of relying on the top-K sample.
  private retrieveForQuestion(question: string, chunks: ProjectChunk[], defaultLimit: number): ProjectSearchResult {
    if (existenceQueryDetector.isExistenceQuery(question)) {
      return {
        query: question,
        mode: 'exhaustive',
        hits: exhaustiveSearch.search(question, chunks, EXHAUSTIVE_SEARCH_LIMIT),
        totalChunksScanned: chunks.length
      };
    }

    return projectRetriever.retrieve(question, chunks, 'hybrid', defaultLimit);
  }

  private extractRequestedFilePath(question: string): string | null {
    const normalized = question.replace(/\r?\n/g, ' ');
    const match = normalized.match(/(?:^|\s|[`"'])(src\/[a-zA-Z0-9_./-]+\.[a-zA-Z0-9]+)(?=[`"'\s]|$)/i);
    return match?.[1]?.trim() ?? null;
  }

  private resolveIndexedPath(index: { files: Array<{ relativePath: string }> }, inputPath: string): { indexPath: string; displayPath: string } | null {
    const normalized = inputPath.replaceAll('\\', '/').replace(/^\.\//, '').trim();

    const exact = index.files.find((file) => file.relativePath === normalized);
    if (exact) {
      return {
        indexPath: exact.relativePath,
        displayPath: this.toDisplayPath(exact.relativePath)
      };
    }

    const suffix = normalized.startsWith('src/') ? normalized : `src/${normalized}`;
    const suffixMatches = index.files.filter((file) => file.relativePath.endsWith(`/${suffix}`) || file.relativePath.endsWith(suffix));
    if (suffixMatches.length === 1) {
      return {
        indexPath: suffixMatches[0].relativePath,
        displayPath: this.toDisplayPath(suffixMatches[0].relativePath)
      };
    }

    return null;
  }

  private toDisplayPath(path: string): string {
    const normalized = path.replaceAll('\\', '/');
    const extractedMarker = 'data/project-index/extracted-project/';
    if (normalized.includes(extractedMarker)) {
      return normalized.slice(normalized.indexOf(extractedMarker) + extractedMarker.length);
    }
    return normalized;
  }

  private toLanguageHint(path: string): string {
    const ext = extname(path).toLowerCase();
    if (ext === '.ts') {
      return 'typescript';
    }
    if (ext === '.html') {
      return 'html';
    }
    if (ext === '.scss' || ext === '.css') {
      return 'css';
    }
    if (ext === '.json') {
      return 'json';
    }
    if (ext === '.js') {
      return 'javascript';
    }
    return 'text';
  }

  private buildStatus(
    fileCount: number,
    chunkCount: number,
    indexedAt: string | null,
    zipSignature: string | null,
    zipPath?: string
  ): ProjectStatus {
    const finalZipPath = zipPath ?? zipManager.getZipPath();
    const zipExists = existsSync(finalZipPath);

    if (!zipExists) {
      logger.warn({ zipPath: finalZipPath }, 'Project zip not found during status check');
    }

    return {
      zipPath: finalZipPath,
      activeZipName: zipManager.getActiveZipName(),
      availableZips: zipManager.listZipFiles(),
      zipExists,
      lastZipSignature: zipSignature,
      extractedPath: zipManager.getExtractedRoot(),
      indexPath: this.indexer.getIndexPath(),
      indexedAt,
      fileCount,
      chunkCount
    };
  }
}

export const projectKnowledgeService = new ProjectKnowledgeService();
