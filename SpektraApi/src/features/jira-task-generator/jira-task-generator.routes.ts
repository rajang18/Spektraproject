import { Router } from 'express';
import { asyncHandler } from '../../core/middleware/async-handler.js';
import { validateRequest } from '../../core/middleware/validate-request.middleware.js';
import { jiraTaskGeneratorController } from './jira-task-generator.controller.js';
import { jiraTaskGeneratorRequestSchema } from './jira-task-generator.schema.js';

export const jiraTaskGeneratorRouter = Router();

jiraTaskGeneratorRouter.post(
  '/generate',
  validateRequest(jiraTaskGeneratorRequestSchema),
  asyncHandler((request, response) => jiraTaskGeneratorController.generate(request, response))
);
