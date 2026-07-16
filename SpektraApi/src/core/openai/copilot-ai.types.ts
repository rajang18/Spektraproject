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

export interface AnalyzeLogsRequest {
  logContent: string;
  environment?: string;
}

export interface AnalyzeLogsResponse {
  summary: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  logBreakdown: Array<{
    logLine: string;
    meaning: string;
    likelyCause: string;
  }>;
  executionFlow: string[];
  thingsToCheck: Array<{
    title: string;
    steps: string[];
    codeSnippet: string;
    codeLanguage: string;
  }>;
  rootCause: {
    evidence: string;
    explanation: string;
    consequences: string[];
  };
  recommendations: string[];
  signals: Array<{
    pattern: string;
    evidence: string;
  }>;
}

export interface GenerateTestCasesRequest {
  requirement: string;
  testLevel?: 'unit' | 'integration' | 'e2e';
}

export interface GenerateTestCasesResponse {
  testLevel: 'unit' | 'integration' | 'e2e';
  testCases: Array<{
    title: string;
    priority: 'low' | 'medium' | 'high';
    preconditions: string[];
    steps: string[];
    expectedResult: string;
  }>;
}

export interface GenerateJiraTasksRequest {
  requirement: string;
  projectKey?: string;
  includeAcceptanceCriteria?: boolean;
}

export interface GenerateJiraTasksResponse {
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
