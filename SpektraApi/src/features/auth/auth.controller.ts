import { Request, Response } from 'express';
import { ok } from '../../core/utils/api-response.js';
import { authService } from './auth.service.js';

export class AuthController {
  async login(request: Request, response: Response): Promise<void> {
    const result = await authService.login(request.body);
    response.status(200).json(ok(result, response.locals['correlationId']));
  }
}

export const authController = new AuthController();
