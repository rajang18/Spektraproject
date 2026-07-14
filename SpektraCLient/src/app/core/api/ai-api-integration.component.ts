import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiApiService } from './ai-api.service';
import { ApiError } from './api-error.model';
import {
  JiraTaskRequest,
  JiraTaskResponse,
  LogAnalysisRequest,
  LogAnalysisResponse,
  RequirementArtifactsRequest,
  RequirementArtifactsResponse,
  TestCaseGenerationRequest,
  TestCaseResponse
} from './ai-api.models';

@Component({
  selector: 'app-ai-api-integration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="ai-api-integration">
      <h2>AI API integration example</h2>

      <div class="card">
        <label>
          Requirement text
          <textarea
            [(ngModel)]="requirementText"
            rows="4"
            placeholder="Describe the requirement to generate artifacts"
          ></textarea>
        </label>

        <button type="button" (click)="onGenerateArtifacts()" [disabled]="api.isLoading()">
          Generate Requirement Artifacts
        </button>
        <button type="button" (click)="onAnalyzeLogs()" [disabled]="api.isLoading()">
          Analyze Logs
        </button>
        <button type="button" (click)="onGenerateTestCases()" [disabled]="api.isLoading()">
          Generate Test Cases
        </button>
        <button type="button" (click)="onGenerateJiraTasks()" [disabled]="api.isLoading()">
          Generate Jira Tasks
        </button>
      </div>

      <div class="status" *ngIf="api.isLoading()">
        <strong>Loading...</strong>
      </div>

      <div class="status error" *ngIf="api.lastError() as error">
        <strong>Error:</strong> {{ error.message }}
      </div>

        <div *ngIf="artifacts() as artifacts">
        <h3>Requirement Artifacts</h3>
        <p><strong>Summary:</strong> {{ artifacts.summary }}</p>
        <p><strong>Architecture overview:</strong> {{ artifacts.architectureOverview }}</p>
        <p><strong>Implementation plan:</strong> {{ artifacts.implementationPlan }}</p>
        <div *ngIf="artifacts.codeExamples.length">
          <h4>Code examples</h4>
          <pre *ngFor="let example of artifacts.codeExamples">{{ example }}</pre>
        </div>
      </div>

      <div *ngIf="analysis() as analysis">
        <h3>Log analysis</h3>
        <p><strong>Summary:</strong> {{ analysis.summary }}</p>
        <p><strong>Root cause:</strong> {{ analysis.rootCause }}</p>
        <p><strong>Severity:</strong> {{ analysis.severity }}</p>
        <p><strong>Impacted module:</strong> {{ analysis.impactedModule }}</p>
        <ul>
          <li *ngFor="let item of analysis.recommendedFixes">Fix: {{ item }}</li>
        </ul>
      </div>

      <div *ngIf="testCases().length">
        <h3>Generated Test Cases</h3>
        <ul>
          <li *ngFor="let testCase of testCases()">
            <strong>{{ testCase.title }}</strong>
            <p>{{ testCase.description }}</p>
            <p><strong>Expected:</strong> {{ testCase.expectedResult }}</p>
          </li>
        </ul>
      </div>

      <div *ngIf="jiraTask() as jiraTask">
        <h3>Jira Task</h3>
        <p><strong>Issue key:</strong> {{ jiraTask.issueKey }}</p>
        <p><strong>Summary:</strong> {{ jiraTask.summary }}</p>
        <p><strong>Description:</strong> {{ jiraTask.description }}</p>
      </div>
    </section>
  `,
  styles: [
    `
      .ai-api-integration {
        display: grid;
        gap: 1rem;
        padding: 1rem;
      }

      .card {
        display: grid;
        gap: 0.75rem;
        padding: 1rem;
        border: 1px solid #ddd;
        border-radius: 0.5rem;
        background: #fff;
      }

      textarea {
        width: 100%;
        min-height: 100px;
        font-family: inherit;
      }

      button {
        width: fit-content;
        padding: 0.75rem 1rem;
      }

      .status.error {
        color: #b00020;
      }

      pre {
        background: #f7f7f7;
        border-radius: 0.25rem;
        padding: 0.75rem;
        overflow-x: auto;
      }
    `
  ]
})
export class AiApiIntegrationComponent {
  readonly api = inject(AiApiService);

  readonly requirementText = signal('Add OAuth login and session timeout handling for the reporting module.');
  readonly artifacts = signal<RequirementArtifactsResponse | null>(null);
  readonly analysis = signal<LogAnalysisResponse | null>(null);
  readonly testCases = signal<TestCaseResponse[]>([]);
  readonly jiraTask = signal<JiraTaskResponse | null>(null);
  readonly error = signal<ApiError | null>(null);

  onGenerateArtifacts(): void {
    this.clearResults();

    const request: RequirementArtifactsRequest = {
      requirement: this.requirementText(),
      language: 'typescript',
      includeExamples: true
    };

    this.api.generateRequirementArtifacts(request).subscribe({
      next: (response) => this.artifacts.set(response),
      error: (err) => this.error.set(err)
    });
  }

  onAnalyzeLogs(): void {
    this.clearResults();

    const request: LogAnalysisRequest = {
      logs: `ERROR 2026-06-14T12:00:00Z AuthService failed to refresh token after 3 retries. Status=401 Unauthorized. CorrelationId=abc123.`,
      environment: 'production'
    };

    this.api.analyzeLogs(request).subscribe({
      next: (response) => this.analysis.set(response),
      error: (err) => this.error.set(err)
    });
  }

  onGenerateTestCases(): void {
    this.clearResults();

    const request: TestCaseGenerationRequest = {
      requirement: this.requirementText(),
      testLevel: 'integration',
      focusArea: 'authentication'
    };

    this.api.generateTestCases(request).subscribe({
      next: (response) => this.testCases.set(response),
      error: (err) => this.error.set(err)
    });
  }

  onGenerateJiraTasks(): void {
    this.clearResults();

    const request: JiraTaskRequest = {
      requirement: this.requirementText(),
      projectKey: 'SPK',
      issueType: 'Story',
      priority: 'High'
    };

    this.api.generateJiraTasks(request).subscribe({
      next: (response) => this.jiraTask.set(response),
      error: (err) => this.error.set(err)
    });
  }

  private clearResults(): void {
    this.artifacts.set(null);
    this.analysis.set(null);
    this.testCases.set([]);
    this.jiraTask.set(null);
    this.error.set(null);
  }
}
