import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgClass, NgFor, NgIf, NgSwitch, NgSwitchCase } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ApiEndpoint, ArtifactView, CodeFile, GeneratedField, generatedModuleMock, JiraTask } from '../../../../shared/models/generated-module.mock';

@Component({
  selector: 'app-jira-generator-page',
  standalone: true,
  imports: [FormsModule, NgClass, NgFor, NgIf, NgSwitch, NgSwitchCase, RouterLink, MatIconModule],
  template: `
    <section class="page-frame">
      <h2 class="screen-title">7. Jira Task Generator</h2>

      <div class="app-panel">
        <div class="tabs">
          <a
            class="tab-link"
            *ngFor="let tab of data.tabs"
            [class.active]="view() === tab.id"
            routerLink="/jira-generator"
            [queryParams]="{ view: tab.id }"
          >
            {{ tab.label }}
          </a>
        </div>

        <div class="panel-body" [ngSwitch]="view()">
          <section *ngSwitchCase="'jira'">
            <div class="page-heading">
              <div>
                <h1>Jira Tasks</h1>
                <p>{{ data.jiraTasks.length }} generated tasks for {{ data.title }}</p>
              </div>
              <button class="btn btn-primary" type="button">
                <mat-icon>add_task</mat-icon>
                Create in Jira
              </button>
            </div>

            <table class="data-table">
              <thead>
                <tr><th>Task ID</th><th>Task Title</th><th>Priority</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let task of data.jiraTasks; trackBy: trackTask">
                  <td>{{ task.id }}</td>
                  <td>{{ task.title }}</td>
                  <td><span class="chip" [ngClass]="priorityClass(task.priority)">{{ task.priority }}</span></td>
                  <td><span class="chip chip-blue">{{ task.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </section>

          <section *ngSwitchCase="'overview'">
            <div class="page-heading">
              <div>
                <h1>{{ data.title }}</h1>
                <span class="chip chip-green">{{ data.status }}</span>
              </div>
            </div>
            <div class="artifact-grid">
              <a class="artifact-card" *ngFor="let artifact of artifacts" routerLink="/jira-generator" [queryParams]="{ view: artifact.view }">
                <span class="icon-badge"><mat-icon>{{ artifact.icon }}</mat-icon></span>
                <span><strong>{{ artifact.title }}</strong><p>{{ artifact.summary }}</p><span class="link-purple">View</span></span>
              </a>
            </div>
          </section>

          <section *ngSwitchCase="'form'" class="split-grid">
            <aside class="side-list">
              <h3>Form Fields</h3>
              <div class="list-item" *ngFor="let field of data.fields">
                <span>{{ field.icon }} {{ field.label }}</span>
                <mat-icon>drag_indicator</mat-icon>
              </div>
            </aside>
            <div class="preview">
              <h3>{{ data.title.replace('Module', 'Form') }}</h3>
              <div class="form-grid">
                <label *ngFor="let field of fields; trackBy: trackField">
                  <span class="field-label">{{ field.label }}</span>
                  <select *ngIf="field.type === 'select'; else fieldInput" class="form-select" [(ngModel)]="field.value" [name]="field.key">
                    <option value="" disabled>{{ field.placeholder }}</option>
                    <option *ngFor="let option of field.options" [value]="option">{{ option }}</option>
                  </select>
                  <ng-template #fieldInput>
                  <ng-container *ngIf="field.type === 'file'; else defaultInput">
                    <input class="form-input" type="file" (change)="onFileChange($event, field)" />
                    <div class="muted" *ngIf="field.value">{{ field.value }}</div>
                  </ng-container>
                  <ng-template #defaultInput>
                    <input class="form-input" [type]="field.type" [placeholder]="field.placeholder" [(ngModel)]="field.value" [name]="field.key" />
                  </ng-template>
                </ng-template>
              </label>
            </div>
          </div>
          </section>

          <section *ngSwitchCase="'api'" class="api-layout">
            <aside class="side-list">
              <h3>API Endpoints</h3>
              <a
                class="endpoint-card"
                *ngFor="let endpoint of data.endpoints; trackBy: trackEndpoint"
                [class.active]="endpoint.id === selectedEndpoint().id"
                routerLink="/jira-generator"
                [queryParams]="{ view: 'api', endpoint: endpoint.id }"
              >
                <p><span class="method">{{ endpoint.method }}</span> {{ endpoint.path }}</p>
                <p class="muted">{{ endpoint.title }}</p>
              </a>
            </aside>
            <div class="preview">
              <div class="page-heading">
                <div>
                  <h1>{{ selectedEndpoint().method }} {{ selectedEndpoint().path }}</h1>
                  <p class="muted">{{ selectedEndpoint().title }}</p>
                </div>
              </div>
              <p class="field-label">{{ selectedEndpoint().bodyLabel }}</p>
              <pre class="code-block">{{ stringify(selectedEndpoint().body) }}</pre>
            </div>
          </section>

          <section *ngSwitchCase="'tests'">
            <div class="page-heading">
              <div>
                <h1>Test Cases</h1>
                <p>{{ data.testCases.length }} generated scenarios for {{ data.title }}</p>
              </div>
            </div>
            <table class="data-table">
              <thead><tr><th>Test Case ID</th><th>Test Case Description</th><th>Expected Result</th></tr></thead>
              <tbody>
                <tr *ngFor="let test of data.testCases; trackBy: trackTest">
                  <td>{{ test.id }}</td>
                  <td>{{ test.description }}</td>
                  <td>{{ test.expectedResult }}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section *ngSwitchCase="'code'" class="split-grid">
            <aside class="side-list">
              <h3>Files</h3>
              <div class="file-tree">
                <a
                  *ngFor="let file of data.codeFiles; trackBy: trackFile"
                  [class.selected]="file.id === selectedFile().id"
                  routerLink="/jira-generator"
                  [queryParams]="{ view: 'code', file: file.id }"
                >
                  {{ file.path }}
                </a>
              </div>
            </aside>
            <div class="preview">
              <div class="page-heading">
                <div>
                  <h1>{{ selectedFile().path }}</h1>
                </div>
              </div>
              <pre class="code-block">{{ selectedFile().content }}</pre>
            </div>
          </section>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JiraGeneratorPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly query = toSignal(this.route.queryParamMap);

  readonly data = generatedModuleMock;
  readonly fields = this.data.fields.map((field) => ({ ...field }));
  readonly view = computed<ArtifactView>(() => (this.query()?.get('view') as ArtifactView | null) ?? 'jira');

  readonly selectedEndpoint = computed<ApiEndpoint>(() => {
    const endpointId = this.query()?.get('endpoint');
    return this.data.endpoints.find((endpoint) => endpoint.id === endpointId) ?? this.data.endpoints[0];
  });

  readonly selectedFile = computed<CodeFile>(() => {
    const fileId = this.query()?.get('file');
    return this.data.codeFiles.find((file) => file.id === fileId) ?? this.data.codeFiles[0];
  });

  readonly artifacts = [
    { view: 'form', icon: 'badge', title: 'Angular Form Generated', summary: `${this.data.fields.length} Fields` },
    { view: 'api', icon: 'api', title: 'API Contract Generated', summary: `${this.data.endpoints.length} APIs Generated` },
    { view: 'jira', icon: 'hub', title: 'Jira Tasks Generated', summary: `${this.data.jiraTasks.length} Tasks` },
    { view: 'tests', icon: 'fact_check', title: 'Test Cases Generated', summary: `${this.data.testCases.length} Test Cases` },
    { view: 'code', icon: 'code', title: 'Code Review Generated', summary: `${this.data.codeFiles.length} Files` }
  ] satisfies Array<{ view: ArtifactView; icon: string; title: string; summary: string }>;

  stringify(value: Record<string, unknown>): string {
    return JSON.stringify(value, null, 2);
  }

  priorityClass(priority: JiraTask['priority']): string {
    return priority === 'High' ? 'chip-red' : priority === 'Medium' ? 'chip-yellow' : 'chip-green';
  }

  onFileChange(event: Event, field: GeneratedField): void {
    const input = event.target as HTMLInputElement;
    field.value = input.files?.[0]?.name ?? '';
  }

  trackTask(_index: number, task: JiraTask): string {
    return task.id;
  }

  trackTest(_index: number, test: { id: string }): string {
    return test.id;
  }

  trackField(_index: number, field: GeneratedField): string {
    return field.key;
  }

  trackEndpoint(_index: number, endpoint: ApiEndpoint): string {
    return endpoint.id;
  }

  trackFile(_index: number, file: CodeFile): string {
    return file.id;
  }
}
