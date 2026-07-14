import { logger } from '../../config/logger.js';

interface RetryOptions {
  attempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  operationName: string;
}

const RETRYABLE_STATUS_CODES = new Set([408, 409, 429, 500, 502, 503, 504]);

function getStatusCode(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    return Number((error as { status?: unknown }).status);
  }

  return undefined;
}

function isRetryable(error: unknown): boolean {
  const status = getStatusCode(error);
  return status === undefined || RETRYABLE_STATUS_CODES.has(status);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function withRetry<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === options.attempts || !isRetryable(error)) {
        throw error;
      }

      const backoffMs = Math.min(options.baseDelayMs * 2 ** (attempt - 1), options.maxDelayMs);
      logger.warn({ error, attempt, backoffMs, operationName: options.operationName }, 'Retrying OpenAI operation');
      await delay(backoffMs);
    }
  }

  throw lastError;
}
