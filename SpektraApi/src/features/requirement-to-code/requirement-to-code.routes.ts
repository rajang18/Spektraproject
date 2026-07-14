import { Router } from 'express';
import { asyncHandler } from '../../core/middleware/async-handler.js';
import { validateRequest } from '../../core/middleware/validate-request.middleware.js';
import { requirementToCodeController } from './requirement-to-code.controller.js';
import { requirementToCodeRequestSchema } from './requirement-to-code.schema.js';

export const requirementToCodeRouter = Router();

requirementToCodeRouter.post(
  '/generate',
  validateRequest(requirementToCodeRequestSchema),
  asyncHandler((request, response) => requirementToCodeController.generate(request, response))
);
