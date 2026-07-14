import { computed, Injectable, signal } from '@angular/core';
import { LogAnalysisResult } from '../models/log-analysis-result.model';

@Injectable()
export class LogAnalyzerStore {
  private readonly _logContent = signal('');
  private readonly _result = signal<LogAnalysisResult | null>(null);
  private readonly _isAnalyzing = signal(false);

  readonly logContent = this._logContent.asReadonly();
  readonly result = this._result.asReadonly();
  readonly isAnalyzing = this._isAnalyzing.asReadonly();
  readonly structuredJson = computed(() => {
    const result = this._result();
    return result ? JSON.stringify(result, null, 2) : null;
  });

  setLogContent(logContent: string): void {
    this._logContent.set(logContent);
  }

  setResult(result: LogAnalysisResult | null): void {
    this._result.set(result);
  }

  setAnalyzing(isAnalyzing: boolean): void {
    this._isAnalyzing.set(isAnalyzing);
  }
}
