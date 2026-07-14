import pino from 'pino';
import { env } from './environment.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: ['req.headers.authorization', 'OPENAI_API_KEY'],
  base: {
    service: 'spektra-api'
  }
});
