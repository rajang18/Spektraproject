import { Router } from 'express';
import { asyncHandler } from '../../core/middleware/async-handler.js';
import { validateRequest } from '../../core/middleware/validate-request.middleware.js';
import { logAnalyzerController } from './log-analyzer.controller.js';
import { logAnalyzerRequestSchema } from './log-analyzer.schema.js';

export const logAnalyzerRouter = Router();

logAnalyzerRouter.post(
  '/analyze',
  validateRequest(logAnalyzerRequestSchema),
  asyncHandler((request, response) => logAnalyzerController.analyze(request, response))
);
