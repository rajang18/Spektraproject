export const API_ENDPOINTS = {
  requirementToCode: {
    generate: '/requirement-to-code/generate'
  },
  logAnalyzer: {
    analyze: '/log-analyzer/analyze'
  },
  jiraGenerator: {
    generate: '/jira-task-generator/generate'
  },
  testCaseGenerator: {
    generate: '/test-case-generator/generate'
  },
  knowledge: {
    chat: '/chat',
    chatStream: '/chat/stream',
    search: '/project/search',
    explain: '/project/explain',
    code: '/project/code',
    index: '/project/index',
    reindex: '/project/reindex',
    status: '/project/status',
    zips: '/project/zips',
    selectZip: '/project/zips/select',
    files: '/project/files',
    features: '/project/features',
    conversations: '/conversations'
  }
} as const;
