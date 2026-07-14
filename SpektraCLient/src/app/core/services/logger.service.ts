import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  info(message: string, context?: unknown): void {
    console.info(message, context);
  }

  error(message: string, context?: unknown): void {
    console.error(message, context);
  }
}
