import { Request, Response } from 'express';
import { ok } from '../../core/utils/api-response.js';
import { jiraTaskGeneratorService } from './jira-task-generator.service.js';

export class JiraTaskGeneratorController {
  async generate(request: Request, response: Response): Promise<void> {
    const result = await jiraTaskGeneratorService.generate(request.body);
    response.status(200).json(ok(result, response.locals['correlationId']));
  }
}

export const jiraTaskGeneratorController = new JiraTaskGeneratorController();
