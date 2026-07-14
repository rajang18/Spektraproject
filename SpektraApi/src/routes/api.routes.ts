import { Router } from 'express';
import { authRouter } from '../features/auth/auth.routes.js';
import { jiraTaskGeneratorRouter } from '../features/jira-task-generator/jira-task-generator.routes.js';
import { logAnalyzerRouter } from '../features/log-analyzer/log-analyzer.routes.js';
import { projectKnowledgeRouter } from '../features/project-knowledge/project-knowledge.routes.js';
import { requirementToCodeRouter } from '../features/requirement-to-code/requirement-to-code.routes.js';
import { testCaseGeneratorRouter } from '../features/test-case-generator/test-case-generator.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/requirement-to-code', requirementToCodeRouter);
apiRouter.use('/log-analyzer', logAnalyzerRouter);
apiRouter.use('/test-case-generator', testCaseGeneratorRouter);
apiRouter.use('/jira-task-generator', jiraTaskGeneratorRouter);
apiRouter.use('/', projectKnowledgeRouter);
