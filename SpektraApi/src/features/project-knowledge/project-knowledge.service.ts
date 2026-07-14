import { projectKnowledgeService } from '../../core/knowledge/project-knowledge.service.js';
import {
  ChatRequest,
  ProjectCodeRequest,
  ProjectExplainRequest,
  ProjectSearchRequest
} from './project-knowledge.schema.js';

export class ProjectKnowledgeFeatureService {
  chat(request: ChatRequest) {
    return projectKnowledgeService.chat(request.question, request.conversationId);
  }

  chatByParams(question: string, conversationId: string) {
    return projectKnowledgeService.chat(question, conversationId);
  }

  search(request: ProjectSearchRequest) {
    return projectKnowledgeService.search(request.query, request.mode, request.limit);
  }

  explain(request: ProjectExplainRequest) {
    return projectKnowledgeService.explain(request.query, request.conversationId);
  }

  code(request: ProjectCodeRequest) {
    return projectKnowledgeService.code(request.filePath);
  }

  index() {
    return projectKnowledgeService.index();
  }

  reindex() {
    return projectKnowledgeService.reindex();
  }

  status() {
    return projectKnowledgeService.status();
  }

  files() {
    return projectKnowledgeService.files();
  }

  features() {
    return projectKnowledgeService.features();
  }

  listConversations(limit?: number) {
    return projectKnowledgeService.listConversations(limit);
  }

  conversationHistory(conversationId: string) {
    return projectKnowledgeService.getConversationHistory(conversationId);
  }

  zips() {
    return projectKnowledgeService.zips();
  }

  selectZip(zipFileName: string) {
    return projectKnowledgeService.selectZip(zipFileName);
  }
}

export const projectKnowledgeFeatureService = new ProjectKnowledgeFeatureService();
