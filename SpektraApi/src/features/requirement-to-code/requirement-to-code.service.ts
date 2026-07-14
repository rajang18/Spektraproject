import { openAiService } from '../../core/openai/openai.service.js';
import { RequirementToCodeRequest } from './requirement-to-code.schema.js';

export class RequirementToCodeService {
  async generateCode(request: RequirementToCodeRequest) {
    return openAiService.generateRequirementArtifacts(request);
  }
}

export const requirementToCodeService = new RequirementToCodeService();
