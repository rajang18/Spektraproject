export const requirementArtifactsJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'summary',
    'files',
    'implementationNotes',
    'risks',
    'isClarificationNeeded',
    'clarificationQuestions',
    'missingInputs'
  ],
  properties: {
    summary: { type: 'string' },
    files: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['fileName', 'language', 'purpose', 'content'],
        properties: {
          fileName: { type: 'string' },
          language: { type: 'string' },
          purpose: { type: 'string' },
          content: { type: 'string' }
        }
      }
    },
    implementationNotes: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
    isClarificationNeeded: { type: 'boolean' },
    clarificationQuestions: { type: 'array', items: { type: 'string' } },
    missingInputs: { type: 'array', items: { type: 'string' } }
  }
} as const;

export const logAnalysisJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'severity', 'probableRootCause', 'recommendations', 'signals'],
  properties: {
    summary: { type: 'string' },
    severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    probableRootCause: { type: 'string' },
    recommendations: { type: 'array', items: { type: 'string' } },
    signals: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['pattern', 'evidence'],
        properties: {
          pattern: { type: 'string' },
          evidence: { type: 'string' }
        }
      }
    }
  }
} as const;

export const testCasesJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['testLevel', 'testCases'],
  properties: {
    testLevel: { type: 'string', enum: ['unit', 'integration', 'e2e'] },
    testCases: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'priority', 'preconditions', 'steps', 'expectedResult'],
        properties: {
          title: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          preconditions: { type: 'array', items: { type: 'string' } },
          steps: { type: 'array', items: { type: 'string' } },
          expectedResult: { type: 'string' }
        }
      }
    }
  }
} as const;

export const jiraTasksJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['tasks'],
  properties: {
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'description', 'issueType', 'priority', 'estimatePoints', 'acceptanceCriteria', 'labels'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          issueType: { type: 'string', enum: ['Story', 'Task', 'Bug', 'Spike'] },
          priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
          estimatePoints: { type: 'number' },
          acceptanceCriteria: { type: 'array', items: { type: 'string' } },
          labels: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }
} as const;
