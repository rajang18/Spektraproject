import { Request, Response } from 'express';
import { ok } from '../../core/utils/api-response.js';
import { logAnalyzerService } from './log-analyzer.service.js';

export class LogAnalyzerController {
  async analyze(request: Request, response: Response): Promise<void> {
    const result = await logAnalyzerService.analyze(request.body);
    response.status(200).json(ok(result, response.locals['correlationId']));
  }
}

export const logAnalyzerController = new LogAnalyzerController();
