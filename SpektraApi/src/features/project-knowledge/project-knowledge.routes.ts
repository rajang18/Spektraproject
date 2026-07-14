import { Router } from 'express';
import { asyncHandler } from '../../core/middleware/async-handler.js';
import { validateRequest } from '../../core/middleware/validate-request.middleware.js';
import { projectKnowledgeController } from './project-knowledge.controller.js';
import {
  chatRequestSchema,
  conversationHistoryParamsSchema,
  conversationListQuerySchema,
  projectCodeRequestSchema,
  projectExplainRequestSchema,
  projectSearchRequestSchema,
  selectZipRequestSchema
} from './project-knowledge.schema.js';

export const projectKnowledgeRouter = Router();

projectKnowledgeRouter.post('/chat', validateRequest(chatRequestSchema), asyncHandler((req, res) => projectKnowledgeController.chat(req, res)));
projectKnowledgeRouter.get('/chat/stream', asyncHandler((req, res) => projectKnowledgeController.chatStream(req, res)));
projectKnowledgeRouter.post('/project/search', validateRequest(projectSearchRequestSchema), asyncHandler((req, res) => projectKnowledgeController.search(req, res)));
projectKnowledgeRouter.post('/project/explain', validateRequest(projectExplainRequestSchema), asyncHandler((req, res) => projectKnowledgeController.explain(req, res)));
projectKnowledgeRouter.post('/project/code', validateRequest(projectCodeRequestSchema), asyncHandler((req, res) => projectKnowledgeController.code(req, res)));
projectKnowledgeRouter.post('/project/index', asyncHandler((req, res) => projectKnowledgeController.index(req, res)));
projectKnowledgeRouter.post('/project/reindex', asyncHandler((req, res) => projectKnowledgeController.reindex(req, res)));
projectKnowledgeRouter.get('/project/status', asyncHandler((req, res) => projectKnowledgeController.status(req, res)));
projectKnowledgeRouter.get('/project/files', asyncHandler((req, res) => projectKnowledgeController.files(req, res)));
projectKnowledgeRouter.get('/project/features', asyncHandler((req, res) => projectKnowledgeController.features(req, res)));
projectKnowledgeRouter.get('/project/zips', asyncHandler((req, res) => projectKnowledgeController.zips(req, res)));
projectKnowledgeRouter.post('/project/zips/select', validateRequest(selectZipRequestSchema), asyncHandler((req, res) => projectKnowledgeController.selectZip(req, res)));
projectKnowledgeRouter.get('/conversations', validateRequest(conversationListQuerySchema), asyncHandler((req, res) => projectKnowledgeController.conversations(req, res)));
projectKnowledgeRouter.get('/conversations/:conversationId', validateRequest(conversationHistoryParamsSchema), asyncHandler((req, res) => projectKnowledgeController.conversationHistory(req, res)));
