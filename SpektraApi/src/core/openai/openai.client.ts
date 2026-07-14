import { AzureOpenAI, OpenAI } from 'openai';
import { env } from '../../config/environment.js';

function createClient(): OpenAI | AzureOpenAI {
  if (env.apiBase) {
    return new AzureOpenAI({
      apiKey: env.OPENAI_API_KEY || 'missing-api-key',
      endpoint: env.apiBase.trim(),
      apiVersion: env.apiVersion || '2024-12-01-preview',
      timeout: env.OPENAI_TIMEOUT_MS
    });
  }

  return new OpenAI({
    apiKey: env.OPENAI_API_KEY || 'missing-openai-api-key',
    timeout: env.OPENAI_TIMEOUT_MS
  });
}

export const openaiClient = createClient();
