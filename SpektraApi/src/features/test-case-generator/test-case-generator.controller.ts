import { Request, Response } from 'express';
import { ok } from '../../core/utils/api-response.js';
import { testCaseGeneratorService } from './test-case-generator.service.js';

export class TestCaseGeneratorController {
  async generate(request: Request, response: Response): Promise<void> {
    const result = await testCaseGeneratorService.generate(request.body);
    response.status(200).json(ok(result, response.locals['correlationId']));
  }
}

export const testCaseGeneratorController = new TestCaseGeneratorController();
