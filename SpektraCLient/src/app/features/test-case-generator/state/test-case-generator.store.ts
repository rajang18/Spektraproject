import { computed, Injectable, signal } from '@angular/core';
import { TestCase } from '../models/test-case.model';

@Injectable()
export class TestCaseGeneratorStore {
  private readonly _requirement = signal('');
  private readonly _testCases = signal<TestCase[]>([]);
  private readonly _isGenerating = signal(false);

  readonly requirement = this._requirement.asReadonly();
  readonly testCases = this._testCases.asReadonly();
  readonly isGenerating = this._isGenerating.asReadonly();
  readonly testCasePreview = computed(() => this._testCases().map((testCase) => testCase.title).join('\n'));

  setRequirement(requirement: string): void {
    this._requirement.set(requirement);
  }

  setTestCases(testCases: TestCase[]): void {
    this._testCases.set(testCases);
  }

  setGenerating(isGenerating: boolean): void {
    this._isGenerating.set(isGenerating);
  }
}
