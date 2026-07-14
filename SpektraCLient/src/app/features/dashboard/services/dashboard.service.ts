import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { BaseApiService } from '../../../core/api/base-api.service';
import { DashboardSummary } from '../models/dashboard-summary.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(BaseApiService);

  getSummary(): Observable<DashboardSummary> {
    return this.api.get<DashboardSummary>(API_ENDPOINTS.dashboard.summary);
  }
}
