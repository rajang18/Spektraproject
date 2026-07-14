import { openAiService } from '../../core/openai/openai.service.js';
import { JiraTaskGeneratorRequest } from './jira-task-generator.schema.js';

export class JiraTaskGeneratorService {
  async generate(request: JiraTaskGeneratorRequest) {
    return openAiService.generateJiraTasks(request);
  }
}

export const jiraTaskGeneratorService = new JiraTaskGeneratorService();
