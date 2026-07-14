import { Request, Response } from 'express';
import { ok } from '../../core/utils/api-response.js';
import { requirementToCodeService } from './requirement-to-code.service.js';

export class RequirementToCodeController {
  async generate(request: Request, response: Response): Promise<void> {
    const result = await requirementToCodeService.generateCode(request.body);
    response.status(200).json(ok(result, response.locals['correlationId']));
  }
}

export const requirementToCodeController = new RequirementToCodeController();
