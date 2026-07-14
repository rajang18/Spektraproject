export class AppError extends Error {
  constructor(
    message: string,
    readonly statusCode = 500,
    readonly code = 'INTERNAL_SERVER_ERROR',
    readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}
