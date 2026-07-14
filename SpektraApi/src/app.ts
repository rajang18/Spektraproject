import compression from 'compression';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { corsOptions } from './config/cors.config.js';
import { env } from './config/environment.js';
import { errorHandler } from './core/middleware/error-handler.middleware.js';
import { notFoundHandler } from './core/middleware/not-found.middleware.js';
import { requestIdMiddleware } from './core/middleware/request-id.middleware.js';
import { requestLogger } from './core/middleware/request-logger.middleware.js';
import { apiRouter } from './routes/api.routes.js';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(compression());
  app.use(express.json({ limit: env.REQUEST_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: env.REQUEST_BODY_LIMIT }));
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders: false
    })
  );
  app.use(requestIdMiddleware);
  app.use(requestLogger);

  app.get('/health', (_request, response) => {
    response.status(200).json({ status: 'ok', service: 'spektra-api' });
  });

  app.use(env.API_PREFIX, apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
