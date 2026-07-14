import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().default('/api/v1'),
  CLIENT_ORIGIN: z.string().default('http://localhost:4200'),
  REQUEST_BODY_LIMIT: z.string().default('1mb'),
  LOG_LEVEL: z.string().default('info'),
  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_MODEL: z.string().default('gpt-4o'),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().positive().default(120000),
  OPENAI_MAX_RETRIES: z.coerce.number().int().positive().default(3),
  OPENAI_RETRY_BASE_DELAY_MS: z.coerce.number().int().positive().default(500),
  OPENAI_RETRY_MAX_DELAY_MS: z.coerce.number().int().positive().default(5000),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(120),
  ENABLE_PROJECT_KNOWLEDGE_INDEXING: z
    .string()
    .default('true')
    .transform((value) => value.trim().toLowerCase() !== 'false'),
  apiBase: z.string().optional().default(''),
  apiVersion: z.string().optional().default('2024-12-01-preview')
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  const missingOrInvalidVariables = parsedEnvironment.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

  throw new Error(
    [
      'Invalid API environment configuration.',
      'Create SpektraApi/.env from SpektraApi/.env.example and set required values.',
      missingOrInvalidVariables
    ].join('\n')
  );
}

export const env = parsedEnvironment.data;
