import { AppError } from '../errors/app-error.js';

export class OpenAiServiceError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 502, 'OPENAI_SERVICE_ERROR', details);
  }
}

export class OpenAiResponseFormatError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 502, 'OPENAI_RESPONSE_FORMAT_ERROR', details);
  }
}
