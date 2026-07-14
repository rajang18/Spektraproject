export interface LogAnalysisResult {
  rootCause: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impactedModule: string;
  probableFix: string;
  recommendedDebuggingSteps: string[];
  preventionSuggestions: string[];
}
