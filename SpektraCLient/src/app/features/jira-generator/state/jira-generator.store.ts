import { computed, Injectable, signal } from '@angular/core';
import { JiraStory } from '../models/jira-story.model';

@Injectable()
export class JiraGeneratorStore {
  private readonly _requirement = signal('');
  private readonly _story = signal<JiraStory | null>(null);
  private readonly _isGenerating = signal(false);

  readonly requirement = this._requirement.asReadonly();
  readonly story = this._story.asReadonly();
  readonly isGenerating = this._isGenerating.asReadonly();
  readonly preview = computed(() => this._story()?.description ?? null);

  setRequirement(requirement: string): void {
    this._requirement.set(requirement);
  }

  setStory(story: JiraStory | null): void {
    this._story.set(story);
  }

  setGenerating(isGenerating: boolean): void {
    this._isGenerating.set(isGenerating);
  }
}
