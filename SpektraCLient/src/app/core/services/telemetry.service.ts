import { inject, Injectable } from '@angular/core';
import { ConfigService } from './config.service';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class TelemetryService {
  private readonly config = inject(ConfigService);
  private readonly logger = inject(LoggerService);

  trackEvent(name: string, properties?: Record<string, unknown>): void {
    if (this.config.enableTelemetry) {
      this.logger.info(`[telemetry] ${name}`, properties);
    }
  }
}
