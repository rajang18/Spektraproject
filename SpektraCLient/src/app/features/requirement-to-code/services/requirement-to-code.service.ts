import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AiApiService } from '../../../core/api/ai-api.service';
import { RequirementArtifactsRequest, RequirementArtifactsResponse } from '../../../core/api/ai-api.models';

@Injectable({ providedIn: 'root' })
export class RequirementToCodeService {
  private readonly aiApiService = inject(AiApiService);

  generateArtifacts(request: RequirementArtifactsRequest): Observable<RequirementArtifactsResponse> {
    return this.aiApiService.generateRequirementArtifacts(request);
  }
}
