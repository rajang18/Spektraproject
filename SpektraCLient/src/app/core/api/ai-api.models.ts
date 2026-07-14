import { ApiError } from './api-error.model';
import { ApiResponse } from './api-response.model';

// ── Requirement to Code ──────────────────────────────────────────────────────

export interface RequirementArtifactsRequest {
  requirement: string;
  targetFramework?: string;
  codingStandards?: string;
  clarificationAnswers?: string[];
}

export interface RequirementArtifactsResponse {
  summary: string;
  files: Array<{
    fileName: string;
    language: string;
    purpose: string;
    content: string;
  }>;
  implementationNotes: string[];
  risks: string[];
  isClarificationNeeded?: boolean;
  clarificationQuestions?: string[];
  missingInputs?: string[];
}

// ── Log Analyzer ─────────────────────────────────────────────────────────────

export interface LogAnalysisRequest {
  logContent: string;
  environment?: string;
}

export interface LogAnalysisResponse {
  summary: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probableRootCause: string;
  recommendations: string[];
  signals: Array<{ pattern: string; evidence: string }>;
}

// ── Test Case Generator ───────────────────────────────────────────────────────

export interface TestCaseGenerationRequest {
  requirement: string;
  testLevel?: 'unit' | 'integration' | 'e2e';
}

export interface TestCaseGenerationResponse {
  testLevel: 'unit' | 'integration' | 'e2e';
  testCases: Array<{
    title: string;
    priority: 'low' | 'medium' | 'high';
    preconditions: string[];
    steps: string[];
    expectedResult: string;
  }>;
}

// ── Jira Task Generator ───────────────────────────────────────────────────────

export interface JiraTaskRequest {
  requirement: string;
  projectKey?: string;
  includeAcceptanceCriteria?: boolean;
}

export interface JiraTaskResponse {
  tasks: Array<{
    title: string;
    description: string;
    issueType: 'Story' | 'Task' | 'Bug' | 'Spike';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    estimatePoints: number;
    acceptanceCriteria: string[];
    labels: string[];
  }>;
}

// ── Knowledge Copilot (C3 RAG) ─────────────────────────────────────────────

export interface KnowledgeChatRequest {
  question: string;
  conversationId?: string;
}

export interface KnowledgeSearchRequest {
  query: string;
  mode?: 'semantic' | 'keyword' | 'hybrid';
  limit?: number;
}

export interface KnowledgeExplainRequest {
  query: string;
  conversationId?: string;
}

export interface KnowledgeCodeRequest {
  filePath: string;
}

export interface KnowledgeChatResponse {
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

export interface KnowledgeSearchResponse {
  query: string;
  mode: 'semantic' | 'keyword' | 'hybrid';
  hits: Array<{
    chunk: {
      relativePath: string;
      startLine: number;
      endLine: number;
      content: string;
      metadata: {
        featureSummary: string;
      };
    };
    semanticScore: number;
    keywordScore: number;
    combinedScore: number;
  }>;
  totalChunksScanned: number;
}

export interface KnowledgeCodeResponse {
  path: string;
  content: string;
}

export interface KnowledgeStatusResponse {
  zipPath: string;
  activeZipName: string | null;
  availableZips: KnowledgeZipOption[];
  zipExists: boolean;
  lastZipSignature: string | null;
  extractedPath: string;
  indexPath: string;
  indexedAt: string | null;
  fileCount: number;
  chunkCount: number;
}

export interface KnowledgeZipOption {
  name: string;
  path: string;
  sizeBytes: number;
  modifiedAt: string;
  isActive: boolean;
}

export interface KnowledgeConversationSummary {
  conversationId: string;
  turnCount: number;
  lastMessageAt: string;
  preview: string;
}

export interface KnowledgeConversationHistory {
  conversationId: string;
  turnCount: number;
  turns: Array<{
    question: string;
    answer: string;
    filesUsed: Array<{ path: string; score: number }>;
    timestamp: string;
  }>;
}

// ── Shared ────────────────────────────────────────────────────────────────────

export interface AiApiResponse<T> extends ApiResponse<T> {}
export interface AiApiError extends ApiError {}
