import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  readonly appName = environment.appName;
  readonly apiBaseUrl = environment.apiBaseUrl;
  readonly aiRequestTimeoutMs = environment.aiRequestTimeoutMs;
  readonly enableTelemetry = environment.enableTelemetry;
}
