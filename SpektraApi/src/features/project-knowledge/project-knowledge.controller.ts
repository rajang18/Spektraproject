import { Request, Response } from 'express';
import { ok } from '../../core/utils/api-response.js';
import { projectKnowledgeFeatureService } from './project-knowledge.service.js';

export class ProjectKnowledgeController {
  async chat(request: Request, response: Response): Promise<void> {
    const result = await projectKnowledgeFeatureService.chat(request.body);
    response.status(200).json(ok(result, response.locals['correlationId']));
  }

  async chatStream(request: Request, response: Response): Promise<void> {
    const question = String(request.query['question'] ?? '').trim();
    const conversationId = String(request.query['conversationId'] ?? 'default-conversation').trim();

    if (!question) {
      response.status(400).json({ succeeded: false, message: 'question query parameter is required' });
      return;
    }

    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders();

    const send = (event: string, data: unknown) => {
      response.write(`event: ${event}\n`);
      response.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    send('meta', { status: 'started' });

    try {
      const result = await projectKnowledgeFeatureService.chatByParams(question, conversationId);
      const words = result.answer.split(/(\s+)/).filter((part) => part.length > 0);

      for (const word of words) {
        send('delta', { chunk: word });
        await new Promise((resolve) => setTimeout(resolve, 5));
      }

      send('done', result);
      response.end();
    } catch (error) {
      send('error', {
        message: error instanceof Error ? error.message : 'SSE chat failed'
      });
      response.end();
    }
  }

  async search(request: Request, response: Response): Promise<void> {
    const result = projectKnowledgeFeatureService.search(request.body);
    response.status(200).json(ok(result, response.locals['correlationId']));
  }

  async explain(request: Request, response: Response): Promise<void> {
    const result = await projectKnowledgeFeatureService.explain(request.body);
    response.status(200).json(ok(result, response.locals['correlationId']));
  }

  async code(request: Request, response: Response): Promise<void> {
    const result = projectKnowledgeFeatureService.code(request.body);
    response.status(200).json(ok(result, response.locals['correlationId']));
  }

  async index(_request: Request, response: Response): Promise<void> {
    const result = projectKnowledgeFeatureService.index();
    response.status(200).json(ok(result, response.locals['correlationId']));
  }

  async reindex(_request: Request, response: Response): Promise<void> {
    const result = projectKnowledgeFeatureService.reindex();
    response.status(200).json(ok(result, response.locals['correlationId']));
  }

  async status(_request: Request, response: Response): Promise<void> {
    const result = projectKnowledgeFeatureService.status();
    response.status(200).json(ok(result, response.locals['correlationId']));
  }

  async files(_request: Request, response: Response): Promise<void> {
    const result = projectKnowledgeFeatureService.files();
    response.status(200).json(ok(result, response.locals['correlationId']));
  }

  async features(_request: Request, response: Response): Promise<void> {
    const result = projectKnowledgeFeatureService.features();
    response.status(200).json(ok(result, response.locals['correlationId']));
  }

  async conversations(request: Request, response: Response): Promise<void> {
    const limit = Number(request.query['limit'] ?? 50);
    const result = projectKnowledgeFeatureService.listConversations(limit);
    response.status(200).json(ok(result, response.locals['correlationId']));
  }

  async conversationHistory(request: Request, response: Response): Promise<void> {
    const conversationId = String(request.params['conversationId'] ?? '').trim();
    const result = projectKnowledgeFeatureService.conversationHistory(conversationId);
    response.status(200).json(ok(result, response.locals['correlationId']));
  }

  async zips(_request: Request, response: Response): Promise<void> {
    const result = projectKnowledgeFeatureService.zips();
    response.status(200).json(ok(result, response.locals['correlationId']));
  }

  async selectZip(request: Request, response: Response): Promise<void> {
    const zipFileName = String(request.body['zipFileName'] ?? '').trim();
    const result = projectKnowledgeFeatureService.selectZip(zipFileName);
    response.status(200).json(ok(result, response.locals['correlationId']));
  }
}

export const projectKnowledgeController = new ProjectKnowledgeController();
