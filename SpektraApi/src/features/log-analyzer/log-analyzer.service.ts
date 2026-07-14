import { openAiService } from '../../core/openai/openai.service.js';
import { LogAnalyzerRequest } from './log-analyzer.schema.js';

export class LogAnalyzerService {
  async analyze(request: LogAnalyzerRequest) {
    return openAiService.analyzeLogs(request);
  }
}

export const logAnalyzerService = new LogAnalyzerService();
