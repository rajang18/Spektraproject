import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { BaseApiService } from '../../../core/api/base-api.service';
import { JiraStory } from '../models/jira-story.model';

interface JiraStoryRequest {
  requirement: string;
}

@Injectable({ providedIn: 'root' })
export class JiraGeneratorService {
  private readonly api = inject(BaseApiService);

  generateStory(requirement: string): Observable<JiraStory> {
    return this.api.post<JiraStoryRequest, JiraStory>(API_ENDPOINTS.jiraGenerator.generate, { requirement });
  }
}
