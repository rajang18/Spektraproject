import { computed, Injectable, signal } from '@angular/core';
import { DevelopmentArtifacts } from '../models/development-artifacts.model';

@Injectable()
export class RequirementToCodeStore {
  private readonly _prompt = signal('');
  private readonly _isGenerating = signal(false);
  private readonly _result = signal<DevelopmentArtifacts | null>(null);

  readonly prompt = this._prompt.asReadonly();
  readonly isGenerating = this._isGenerating.asReadonly();
  readonly result = this._result.asReadonly();
  readonly generatedContent = computed(() => {
    const result = this._result();
    return result ? JSON.stringify(result, null, 2) : null;
  });

  setPrompt(prompt: string): void {
    this._prompt.set(prompt);
  }

  setGenerating(isGenerating: boolean): void {
    this._isGenerating.set(isGenerating);
  }

  setResult(result: DevelopmentArtifacts | null): void {
    this._result.set(result);
  }
}
