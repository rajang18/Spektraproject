import { Router } from 'express';
import { asyncHandler } from '../../core/middleware/async-handler.js';
import { validateRequest } from '../../core/middleware/validate-request.middleware.js';
import { testCaseGeneratorController } from './test-case-generator.controller.js';
import { testCaseGeneratorRequestSchema } from './test-case-generator.schema.js';

export const testCaseGeneratorRouter = Router();

testCaseGeneratorRouter.post(
  '/generate',
  validateRequest(testCaseGeneratorRequestSchema),
  asyncHandler((request, response) => testCaseGeneratorController.generate(request, response))
);
