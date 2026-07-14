import { pinoHttp } from 'pino-http';
import { logger } from '../../config/logger.js';

export const requestLogger = pinoHttp({
  logger,
  genReqId: (request, response) => {
    return response.getHeader('X-Correlation-Id')?.toString() ?? request.headers['x-request-id']?.toString() ?? crypto.randomUUID();
  }
});
