import { Router } from 'express';
import { asyncHandler } from '../../core/middleware/async-handler.js';
import { validateRequest } from '../../core/middleware/validate-request.middleware.js';
import { authController } from './auth.controller.js';
import { authLoginRequestSchema } from './auth.schema.js';

export const authRouter = Router();

authRouter.post(
  '/login',
  validateRequest(authLoginRequestSchema),
  asyncHandler((request, response) => authController.login(request, response))
);
