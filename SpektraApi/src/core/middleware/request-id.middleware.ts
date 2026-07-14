import { randomUUID } from 'node:crypto';
import { RequestHandler } from 'express';

export const requestIdMiddleware: RequestHandler = (request, response, next) => {
  const correlationId = request.header('X-Correlation-Id') ?? randomUUID();
  response.locals['correlationId'] = correlationId;
  response.setHeader('X-Correlation-Id', correlationId);
  next();
};
