import { computed, Injectable, signal } from '@angular/core';
import { DashboardSummary } from '../models/dashboard-summary.model';

@Injectable()
export class DashboardStore {
  private readonly _summary = signal<DashboardSummary | null>(null);
  private readonly _isLoading = signal(false);

  readonly summary = this._summary.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly hasSummary = computed(() => this._summary() !== null);

  setSummary(summary: DashboardSummary): void {
    this._summary.set(summary);
  }

  setLoading(isLoading: boolean): void {
    this._isLoading.set(isLoading);
  }
}
