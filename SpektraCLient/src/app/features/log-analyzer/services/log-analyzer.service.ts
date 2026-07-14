import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AiApiService } from '../../../core/api/ai-api.service';
import { LogAnalysisRequest, LogAnalysisResponse } from '../../../core/api/ai-api.models';

@Injectable({ providedIn: 'root' })
export class LogAnalyzerService {
  private readonly aiApiService = inject(AiApiService);

  analyze(request: LogAnalysisRequest): Observable<LogAnalysisResponse> {
    return this.aiApiService.analyzeLogs(request);
  }
}
