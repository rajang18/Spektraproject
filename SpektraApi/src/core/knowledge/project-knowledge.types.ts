export type SearchMode = 'semantic' | 'keyword' | 'hybrid';

export interface ProjectFileMetadata {
  fileName: string;
  relativePath: string;
  extension: string;
  folder: string;
  componentName?: string;
  moduleName?: string;
  classNames: string[];
  functions: string[];
  methods: string[];
  imports: string[];
  exports: string[];
  interfaces: string[];
  servicesUsed: string[];
  apiUrls: string[];
  routePaths: string[];
  angularSelector?: string;
  featureSummary: string;
}

export interface ProjectChunk {
  id: string;
  relativePath: string;
  startLine: number;
  endLine: number;
  content: string;
  embedding: number[];
  tokenHints: string[];
  metadata: ProjectFileMetadata;
}

export interface ProjectIndexData {
  projectName: string;
  sourceRoot: string;
  zipSignature: string;
  indexedAt: string;
  files: ProjectFileMetadata[];
  chunks: ProjectChunk[];
}

export interface SearchHit {
  chunk: ProjectChunk;
  semanticScore: number;
  keywordScore: number;
  combinedScore: number;
}

export interface ProjectSearchResult {
  query: string;
  mode: SearchMode;
  hits: SearchHit[];
  totalChunksScanned: number;
}

export interface ChatTurn {
  question: string;
  answer: string;
  filesUsed: Array<{ path: string; score: number }>;
  timestamp: string;
}

export interface ConversationSummary {
  conversationId: string;
  turnCount: number;
  lastMessageAt: string;
  preview: string;
}

export interface ConversationHistory {
  conversationId: string;
  turnCount: number;
  turns: ChatTurn[];
}

export interface ChatAnswer {
  mode: 'c3' | 'general';
  summary: string;
  answer: string;
  explanation: string;
  filesUsed: Array<{ path: string; score: number; chunk: string }>;
  relevantCode: Array<{ path: string; startLine: number; endLine: number; code: string }>;
  executionFlow: string[];
  relatedComponents: string[];
  confidence: number;
  suggestedFollowUps: string[];
  search: {
    semanticHits: number;
    keywordHits: number;
    retrievedChunks: number;
  };
}

export interface ProjectStatus {
  zipPath: string;
  activeZipName: string | null;
  availableZips: Array<{
    name: string;
    path: string;
    sizeBytes: number;
    modifiedAt: string;
    isActive: boolean;
  }>;
  zipExists: boolean;
  lastZipSignature: string | null;
  extractedPath: string;
  indexPath: string;
  indexedAt: string | null;
  fileCount: number;
  chunkCount: number;
}
