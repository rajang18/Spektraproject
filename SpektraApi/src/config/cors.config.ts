import { CorsOptions } from 'cors';
import { env } from './environment.js';

export const corsOptions: CorsOptions = {
  origin: env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id']
};
