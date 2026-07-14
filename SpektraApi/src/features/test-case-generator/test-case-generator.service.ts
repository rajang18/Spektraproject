import { openAiService } from '../../core/openai/openai.service.js';
import { TestCaseGeneratorRequest } from './test-case-generator.schema.js';

export class TestCaseGeneratorService {
  async generate(request: TestCaseGeneratorRequest) {
    return openAiService.generateTestCases(request);
  }
}

export const testCaseGeneratorService = new TestCaseGeneratorService();
