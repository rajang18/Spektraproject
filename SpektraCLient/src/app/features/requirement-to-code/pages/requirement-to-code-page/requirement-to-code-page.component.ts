import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgClass, NgFor, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { AiApiService } from '../../../../core/api/ai-api.service';

type ArtifactView = 'overview' | 'notes' | 'risks' | 'jira' | 'tests' | 'code';
type TaskStatus   = 'To Do' | 'In Progress' | 'Done';

interface PageFile {
  id: string;
  path: string;
  language: string;
  purpose: string;
  content: string;
}

interface PageJiraTask {
  id: string;
  title: string;
  issueType: string;
  priority: 'High' | 'Medium' | 'Low';
  status: TaskStatus;
  estimatePoints: number;
}

interface PageTestCase {
  id: string;
  description: string;
  expectedResult: string;
  priority: string;
  steps: string[];
}

interface GeneratedArtifacts {
  summary: string;
  implementationNotes: string[];
  risks: string[];
  files: PageFile[];
  jiraTasks: PageJiraTask[];
  testCases: PageTestCase[];
}

interface PersistedRequirementToCodeState {
  requirementText: string;
  artifacts: GeneratedArtifacts;
}

@Component({
  selector: 'app-requirement-to-code-page',
  standalone: true,
  imports: [
    FormsModule, NgClass, NgFor, NgIf, NgSwitch, NgSwitchCase,
    NgSwitchDefault, NgTemplateOutlet, RouterLink, MatIconModule
  ],
  template: `
    <section class="page-frame">
      <h2 class="screen-title">{{ title() }}</h2>

      <ng-container [ngSwitch]="view()">

        <!-- ── Input ── -->
        <div *ngSwitchCase="'input'" class="app-panel">
          <div class="panel-body">
            <div class="page-heading">
              <div>
                <h1>Requirement to Code</h1>
                <p>Enter your requirement in natural language</p>
                <div class="mode-switch">
                  <a class="btn btn-primary" routerLink="/requirement-to-code"><mat-icon>terminal</mat-icon> Requirement Mode</a>
                  <a class="btn btn-outline" routerLink="/knowledge-copilot"><mat-icon>psychology</mat-icon> Knowledge Mode</a>
                </div>
              </div>
            </div>

            <textarea
              class="form-textarea"
              [(ngModel)]="requirementText"
              placeholder="Describe your requirement in detail…&#10;&#10;Example: Build an Employee Onboarding Module with fields for Name, Email, Mobile, Department, and PAN Card. Include email verification, admin approval workflow, and export to Excel."
            ></textarea>
            <div class="char-count">{{ requirementText.length }} / 4000 characters</div>

            <div class="error-banner" *ngIf="error()">
              <mat-icon>error_outline</mat-icon>
              <span>{{ error() }}</span>
            </div>

            <div class="clarification-panel" *ngIf="clarificationQuestions().length">
              <h3>More details are needed before final generation</h3>
              <p class="muted" *ngIf="missingInputs().length">Missing inputs: {{ missingInputs().join(', ') }}</p>
              <div class="clarification-item" *ngFor="let question of clarificationQuestions(); let i = index">
                <label class="clarification-label">{{ i + 1 }}. {{ question }}</label>
                <textarea
                  class="form-textarea clarification-textarea"
                  [value]="clarificationAnswers()[i] || ''"
                  (input)="setClarificationAnswer(i, $any($event.target).value)"
                  placeholder="Provide the missing detail..."
                ></textarea>
              </div>
            </div>

            <div class="section-bar">
              <span></span>
              <button
                class="btn btn-primary"
                type="button"
                (click)="generateCode()"
                [disabled]="requirementText.trim().length < 20 || !clarificationAnswersValid()"
              >
                <mat-icon>auto_awesome</mat-icon>
                {{ clarificationQuestions().length ? 'Re-generate with Clarifications' : 'Generate with AI' }}
              </button>
            </div>
          </div>
        </div>

        <!-- ── Loader ── -->
        <div *ngSwitchCase="'loader'" class="app-panel loader-panel">
          <div class="loader-content">
            <div class="bot-ring"><div class="bot-face"></div></div>
            <div>
              <h1 class="section-title">AI is analyzing your requirement…</h1>
              <p class="muted">Generating code files, Jira tasks, and test cases<br />using Azure OpenAI — this may take up to 60 seconds.</p>
            </div>
            <div class="progress-track">
              <span class="progress-fill progress-pulse"></span>
            </div>
            <p class="muted">Generating — please wait…</p>
          </div>
        </div>

        <!-- ── Result views ── -->
        <div *ngSwitchDefault class="app-panel">
          <ng-container *ngTemplateOutlet="artifactTabs"></ng-container>

          <div class="panel-body" [ngSwitch]="view()">

            <!-- Overview -->
            <section *ngSwitchCase="'overview'">
              <div class="page-heading">
                <div>
                  <h1>Generated Artifacts</h1>
                  <span class="chip chip-green">Generated Successfully</span>
                </div>
                <button class="btn btn-outline" type="button" (click)="resetToInput()">
                  <mat-icon>add</mat-icon>New Requirement
                </button>
              </div>
              <p class="muted overview-summary" *ngIf="artifacts()?.summary">{{ artifacts()?.summary }}</p>
              <div class="artifact-grid">
                <a
                  class="artifact-card"
                  *ngFor="let card of artifactCards()"
                  routerLink="/requirement-to-code"
                  [queryParams]="{ view: card.view }"
                >
                  <span class="icon-badge"><mat-icon>{{ card.icon }}</mat-icon></span>
                  <span>
                    <strong>{{ card.title }}</strong>
                    <p>{{ card.summary }}</p>
                    <span class="link-purple">View</span>
                  </span>
                </a>
              </div>
            </section>

            <!-- Implementation Notes -->
            <section *ngSwitchCase="'notes'">
              <div class="page-heading">
                <div>
                  <h1>Implementation Notes</h1>
                  <p>Key considerations for this implementation</p>
                </div>
              </div>
              <div class="notes-list">
                <div class="note-item" *ngFor="let note of artifacts()?.implementationNotes; let i = index">
                  <span class="note-index">{{ i + 1 }}</span>
                  <p>{{ note }}</p>
                </div>
                <p class="muted" *ngIf="!artifacts()?.implementationNotes?.length">No implementation notes generated.</p>
              </div>
            </section>

            <!-- Risks -->
            <section *ngSwitchCase="'risks'">
              <div class="page-heading">
                <div>
                  <h1>Risks &amp; Considerations</h1>
                  <p>Potential risks identified by AI analysis</p>
                </div>
              </div>
              <div class="notes-list">
                <div class="note-item note-risk" *ngFor="let risk of artifacts()?.risks; let i = index">
                  <mat-icon class="risk-icon">warning_amber</mat-icon>
                  <p>{{ risk }}</p>
                </div>
                <p class="muted" *ngIf="!artifacts()?.risks?.length">No risks identified.</p>
              </div>
            </section>

            <!-- Jira Tasks -->
            <section *ngSwitchCase="'jira'">
              <div class="page-heading">
                <div>
                  <h1>Jira Tasks</h1>
                  <p>{{ artifacts()?.jiraTasks?.length ?? 0 }} tasks generated — click the status to update it</p>
                </div>
              </div>
              <div class="table-scroll">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Task ID</th>
                      <th>Task Title</th>
                      <th>Type</th>
                      <th>Priority</th>
                      <th style="text-align:center">Points</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let task of artifacts()?.jiraTasks">
                      <td class="task-id">{{ task.id }}</td>
                      <td class="task-title">{{ task.title }}</td>
                      <td><span class="chip chip-blue">{{ task.issueType }}</span></td>
                      <td>
                        <span class="chip" [ngClass]="priorityClass(task.priority)">{{ task.priority }}</span>
                      </td>
                      <td style="text-align:center">
                        <span class="points-badge">{{ task.estimatePoints }}</span>
                      </td>
                      <td>
                        <select
                          class="status-select"
                          [ngClass]="statusSelectClass(task.status)"
                          (change)="updateTaskStatus(task.id, $any($event.target).value)"
                        >
                          <option value="To Do"      [selected]="task.status === 'To Do'">To Do</option>
                          <option value="In Progress" [selected]="task.status === 'In Progress'">In Progress</option>
                          <option value="Done"        [selected]="task.status === 'Done'">Done</option>
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <!-- Test Cases -->
            <section *ngSwitchCase="'tests'">
              <div class="page-heading">
                <div>
                  <h1>Test Cases</h1>
                  <p>{{ artifacts()?.testCases?.length ?? 0 }} test cases generated</p>
                </div>
              </div>
              <div class="table-scroll">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Test ID</th>
                      <th>Description</th>
                      <th>Priority</th>
                      <th>Expected Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let test of artifacts()?.testCases">
                      <td class="task-id">{{ test.id }}</td>
                      <td>{{ test.description }}</td>
                      <td>
                        <span class="chip" [ngClass]="priorityClass(capitalize(test.priority))">
                          {{ capitalize(test.priority) }}
                        </span>
                      </td>
                      <td>{{ test.expectedResult }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <!-- Code Preview — full-bleed split layout -->
            <section *ngSwitchCase="'code'" class="code-view">
              <!-- File sidebar -->
              <aside class="code-sidebar">
                <div class="sidebar-header">
                  <mat-icon>folder_open</mat-icon>
                  <h3>Files</h3>
                  <span class="file-count">{{ artifacts()?.files?.length ?? 0 }}</span>
                </div>
                <nav class="file-nav">
                  <a
                    *ngFor="let file of artifacts()?.files"
                    class="file-entry"
                    [class.selected]="file.id === selectedFile()?.id"
                    routerLink="/requirement-to-code"
                    [queryParams]="{ view: 'code', file: file.id }"
                    [title]="file.path"
                  >
                    <mat-icon class="file-icon-sm">{{ fileIcon(file.language) }}</mat-icon>
                    <span class="file-name">{{ file.path }}</span>
                    <span class="lang-badge">{{ shortLang(file.language) }}</span>
                  </a>
                </nav>
              </aside>

              <!-- Code area -->
              <div class="code-area">
                <ng-container *ngIf="selectedFile(); else noFile">
                  <div class="code-topbar">
                    <div class="code-file-info">
                      <mat-icon>{{ fileIcon(selectedFile()!.language) }}</mat-icon>
                      <span class="code-file-path">{{ selectedFile()!.path }}</span>
                    </div>
                    <span class="chip chip-blue">{{ selectedFile()!.language }}</span>
                  </div>
                  <p class="code-purpose" *ngIf="selectedFile()!.purpose">{{ selectedFile()!.purpose }}</p>
                  <div class="code-scroll">
                    <pre class="code-pre">{{ selectedFile()!.content }}</pre>
                  </div>
                </ng-container>
                <ng-template #noFile>
                  <div class="code-empty">
                    <mat-icon>code_off</mat-icon>
                    <p>Select a file from the sidebar</p>
                  </div>
                </ng-template>
              </div>
            </section>

          </div>
        </div>
      </ng-container>
    </section>

    <!-- ── Tabs ── -->
    <ng-template #artifactTabs>
      <div class="tabs">
        <a
          class="tab-link"
          *ngFor="let tab of tabs"
          [class.active]="view() === tab.id"
          routerLink="/requirement-to-code"
          [queryParams]="{ view: tab.id }"
        >{{ tab.label }}</a>
      </div>
    </ng-template>
  `,
  styles: [`
    /* ── Shared ─────────────────────────────────────────────── */
    .overview-summary {
      margin-bottom: 20px;
      font-size: 14px;
      line-height: 1.6;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      margin: 12px 0;
      background: #fff5f5;
      border: 1px solid #ffcccc;
      border-radius: 8px;
      color: #c53030;
      font-size: 14px;
    }

    .clarification-panel {
      margin: 14px 0 10px;
      padding: 14px;
      border-radius: 10px;
      border: 1px solid #d7deff;
      background: #f7f9ff;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .clarification-panel h3 {
      margin: 0;
      font-size: 15px;
      color: #2d3553;
    }

    .clarification-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .clarification-label {
      font-size: 13px;
      font-weight: 600;
      color: #2d3553;
    }

    .clarification-textarea {
      min-height: 84px;
    }

    .mode-switch {
      display: flex;
      gap: 8px;
      margin-top: 10px;
      flex-wrap: wrap;
    }

    /* ── Notes / Risks ───────────────────────────────────────── */
    .notes-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px 0;
    }

    .note-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      background: #f8f9ff;
      border-radius: 8px;
      border-left: 3px solid #6c5ce7;
    }

    .note-item p { margin: 0; font-size: 14px; line-height: 1.6; }

    .note-index {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: 24px;
      background: #6c5ce7;
      color: #fff;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .note-item.note-risk { background: #fff8f0; border-left-color: #e67e22; }
    .risk-icon { color: #e67e22; font-size: 20px; margin-top: 2px; flex-shrink: 0; }

    /* ── Tables ──────────────────────────────────────────────── */
    .table-scroll {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      border-radius: 6px;
    }

    .task-id {
      white-space: nowrap;
      font-family: Consolas, monospace;
      font-size: 0.8rem;
      color: #6c42e2;
    }

    .task-title {
      min-width: 200px;
      max-width: 340px;
    }

    .points-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #edf0ff;
      color: #5b3fd1;
      font-size: 0.78rem;
      font-weight: 700;
    }

    /* ── Status select ───────────────────────────────────────── */
    .status-select {
      appearance: none;
      -webkit-appearance: none;
      padding: 5px 28px 5px 10px;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      outline: none;
      border: 1.5px solid #cdd0da;
      background-color: #f8f9fb;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23687085'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 8px center;
      min-width: 108px;
      transition: border-color .15s, background-color .15s;
    }

    .status-select:focus { border-color: #7c45f5; }

    .status-select.status-todo {
      background-color: #f4f5f7;
      border-color: #b3bac9;
      color: #42526e;
    }

    .status-select.status-inprogress {
      background-color: #f0ebff;
      border-color: #9d74f5;
      color: #5b3fd1;
    }

    .status-select.status-done {
      background-color: #e6f9f1;
      border-color: #5fcf94;
      color: #167a4d;
    }

    /* ── Loader ──────────────────────────────────────────────── */
    .progress-pulse {
      width: 100% !important;
      background: linear-gradient(90deg, #6c5ce7 0%, #a29bfe 50%, #6c5ce7 100%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0%   { background-position: 200% center; }
      100% { background-position: -200% center; }
    }

    /* ── Code View ───────────────────────────────────────────── */
    /*  Escape panel-body padding so the code view spans the full panel */
    .code-view {
      display: grid;
      grid-template-columns: 256px 1fr;
      gap: 0;
      min-height: 520px;
      margin: -26px -32px -26px -32px;
    }

    /* Sidebar */
    .code-sidebar {
      border-right: 1px solid var(--line);
      background: #fbfcff;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 16px 10px;
      border-bottom: 1px solid var(--line);
      flex-shrink: 0;
    }

    .sidebar-header mat-icon { color: #687085; font-size: 18px; }
    .sidebar-header h3 { margin: 0; font-size: 0.88rem; font-weight: 700; color: #253044; }

    .file-count {
      margin-left: auto;
      font-size: 0.72rem;
      font-weight: 700;
      background: #e8e3ff;
      color: #5b3fd1;
      border-radius: 999px;
      padding: 2px 7px;
    }

    .file-nav {
      overflow-y: auto;
      flex: 1;
      padding: 8px;
    }

    .file-entry {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 8px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 0.81rem;
      color: #334052;
      text-decoration: none;
      transition: background .12s;
      overflow: hidden;        /* prevent sidebar overflow */
    }

    .file-entry:hover { background: #f0eeff; }

    .file-entry.selected {
      background: var(--purple-soft);
      color: var(--purple-strong);
      font-weight: 600;
    }

    .file-icon-sm { font-size: 15px; flex-shrink: 0; }

    .file-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;        /* allow flex child to shrink below its content size */
    }

    .lang-badge {
      flex-shrink: 0;
      font-size: 0.65rem;
      font-weight: 700;
      background: #e8e3ff;
      color: #6b3fd1;
      border-radius: 4px;
      padding: 1px 5px;
      text-transform: uppercase;
    }

    /* Code content area */
    .code-area {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    .code-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 20px;
      border-bottom: 1px solid var(--line);
      background: #fafbff;
      flex-shrink: 0;
      flex-wrap: wrap;
    }

    .code-file-info {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      overflow: hidden;
    }

    .code-file-info mat-icon { color: #687085; flex-shrink: 0; }

    .code-file-path {
      font-size: 0.84rem;
      font-weight: 600;
      color: #253044;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .code-purpose {
      margin: 0;
      padding: 8px 20px;
      font-size: 0.8rem;
      color: var(--muted);
      background: #f7f8fc;
      border-bottom: 1px solid var(--line);
      flex-shrink: 0;
    }

    /* Scrollable code block */
    .code-scroll {
      flex: 1;
      overflow: auto;              /* both axes */
      -webkit-overflow-scrolling: touch;
      background: #0d1117;
    }

    .code-pre {
      margin: 0;
      padding: 20px 24px;
      color: #e6edf3;
      font-family: Consolas, 'Courier New', monospace;
      font-size: 0.84rem;
      line-height: 1.65;
      white-space: pre;            /* keep indentation, enable h-scroll */
      tab-size: 2;
      min-width: max-content;      /* grow with content so scroll works */
    }

    .code-empty {
      flex: 1;
      display: grid;
      place-items: center;
      gap: 8px;
      color: var(--muted);
      text-align: center;
    }

    /* ── Responsive ──────────────────────────────────────────── */
    @media (max-width: 980px) {
      .code-view {
        grid-template-columns: 1fr;
        margin: -22px -22px -22px -22px;
      }

      .code-sidebar {
        border-right: 0;
        border-bottom: 1px solid var(--line);
        max-height: 220px;
      }

      .file-nav {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        overflow-y: hidden;
        overflow-x: auto;
        padding: 8px;
      }

      .file-entry {
        flex: 0 0 auto;
        max-width: 180px;
      }
    }

    @media (max-width: 680px) {
      .code-view {
        margin: -22px -22px -22px -22px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequirementToCodePageComponent {
  private static readonly ARTIFACTS_STORAGE_KEY = 'requirementToCode.generatedArtifacts';

  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly aiApiService = inject(AiApiService);
  private readonly query      = toSignal(this.route.queryParamMap);

  requirementText = '';

  private readonly _artifacts   = signal<GeneratedArtifacts | null>(null);
  private readonly _isGenerating = signal(false);
  private readonly _error        = signal<string | null>(null);
  private readonly _clarificationQuestions = signal<string[]>([]);
  private readonly _missingInputs = signal<string[]>([]);
  private readonly _clarificationAnswers = signal<string[]>([]);

  constructor() {
    this.restoreArtifacts();
  }

  readonly artifacts = computed(() => this._artifacts());
  readonly error     = computed(() => this._error());
  readonly clarificationQuestions = computed(() => this._clarificationQuestions());
  readonly missingInputs = computed(() => this._missingInputs());
  readonly clarificationAnswers = computed(() => this._clarificationAnswers());
  readonly clarificationAnswersValid = computed(() => {
    const questions = this._clarificationQuestions();
    if (!questions.length) {
      return true;
    }

    const answers = this._clarificationAnswers();
    return questions.every((_, index) => (answers[index] ?? '').trim().length >= 1);
  });

  readonly view = computed<ArtifactView | 'input' | 'loader'>(() => {
    if (this._isGenerating()) return 'loader';
    const v = this.query()?.get('view');
    if (v && ['overview', 'notes', 'risks', 'jira', 'tests', 'code'].includes(v)) {
      return v as ArtifactView;
    }
    if (this._artifacts()) {
      return 'overview';
    }
    return 'input';
  });

  readonly tabs: Array<{ id: ArtifactView; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'notes',    label: 'Impl. Notes' },
    { id: 'risks',    label: 'Risks' },
    { id: 'jira',     label: 'Jira Tasks' },
    { id: 'tests',    label: 'Test Cases' },
    { id: 'code',     label: 'Code Preview' }
  ];

  readonly artifactCards = computed(() => {
    const d = this._artifacts();
    return [
      { view: 'notes' as ArtifactView, icon: 'lightbulb',     title: 'Implementation Notes',   summary: `${d?.implementationNotes.length ?? 0} notes` },
      { view: 'risks' as ArtifactView, icon: 'warning_amber', title: 'Risks & Considerations', summary: `${d?.risks.length ?? 0} risks` },
      { view: 'jira'  as ArtifactView, icon: 'hub',            title: 'Jira Tasks',             summary: `${d?.jiraTasks.length ?? 0} tasks` },
      { view: 'tests' as ArtifactView, icon: 'fact_check',     title: 'Test Cases',             summary: `${d?.testCases.length ?? 0} test cases` },
      { view: 'code'  as ArtifactView, icon: 'code',           title: 'Code Files',             summary: `${d?.files.length ?? 0} files` }
    ];
  });

  readonly selectedFile = computed<PageFile | null>(() => {
    const fileId = this.query()?.get('file');
    const files  = this._artifacts()?.files ?? [];
    return files.find(f => f.id === fileId) ?? files[0] ?? null;
  });

  readonly title = computed(() => {
    const map: Record<ArtifactView | 'input' | 'loader', string> = {
      input:    '2. Requirement Input',
      loader:   '3. AI Generating…',
      overview: '4. Generated Output Overview',
      notes:    '5. Implementation Notes',
      risks:    '6. Risks & Considerations',
      jira:     '7. Jira Tasks',
      tests:    '8. Test Case Generator',
      code:     '9. Code Preview'
    };
    return map[this.view()] ?? map['input'];
  });

  // ── Generate ────────────────────────────────────────────────

  generateCode(): void {
    const requirement = this.requirementText.trim();
    if (requirement.length < 20 || this._isGenerating()) return;

    if (!this.areClarificationAnswersValid()) {
      this._error.set('Please answer all clarification questions before re-generating.');
      return;
    }

    const clarificationAnswers = this._clarificationQuestions().length
      ? this._clarificationAnswers().map((answer) => answer.trim())
      : undefined;

    this._isGenerating.set(true);
    this._error.set(null);

    this.aiApiService
      .generateRequirementArtifacts({
        requirement,
        targetFramework: 'Angular 18 and Node.js',
        clarificationAnswers
      })
      .subscribe({
      next: (code) => {
        if (code.isClarificationNeeded) {
          const questions = code.clarificationQuestions ?? [];
          this._clarificationQuestions.set(questions);
          this._missingInputs.set(code.missingInputs ?? []);
          const existingAnswers = this._clarificationAnswers();
          this._clarificationAnswers.set(questions.map((_, index) => existingAnswers[index] ?? ''));
          this._artifacts.set(null);
          this.clearPersistedArtifacts();
          this._isGenerating.set(false);
          this.router.navigate(['/requirement-to-code'], { queryParams: {} });
          return;
        }

        this._clarificationQuestions.set([]);
        this._missingInputs.set([]);
        this._clarificationAnswers.set([]);

        forkJoin({
          jira: this.aiApiService.generateJiraTasks({ requirement, includeAcceptanceCriteria: true }),
          tests: this.aiApiService.generateTestCases({ requirement, testLevel: 'unit' })
        }).subscribe({
          next: ({ jira, tests }) => {
        const generatedArtifacts: GeneratedArtifacts = {
          summary:             code.summary,
          implementationNotes: code.implementationNotes,
          risks:               code.risks,
          files: code.files.map((f, i) => ({
            id:       `file-${i}`,
            path:     f.fileName,
            language: f.language,
            purpose:  f.purpose,
            content:  f.content
          })),
          jiraTasks: jira.tasks.map((t, i) => ({
            id:             `TASK-${String(i + 1).padStart(3, '0')}`,
            title:          t.title,
            issueType:      t.issueType,
            priority:       this.normalizePriority(t.priority),
            status:         'To Do',
            estimatePoints: t.estimatePoints
          })),
          testCases: tests.testCases.map((t, i) => ({
            id:             `TC-${String(i + 1).padStart(3, '0')}`,
            description:    t.title,
            expectedResult: t.expectedResult,
            priority:       t.priority,
            steps:          t.steps
          }))
        };

        this._artifacts.set(generatedArtifacts);
        this.persistArtifacts(generatedArtifacts, requirement);

        this._isGenerating.set(false);
        this.router.navigate(['/requirement-to-code'], { queryParams: { view: 'overview' } });
      },
          error: (err) => this.handleGenerationError(err)
        });
      },
      error: (err) => this.handleGenerationError(err)
    });
  }

  resetToInput(): void {
    this._artifacts.set(null);
    this._error.set(null);
    this._clarificationQuestions.set([]);
    this._missingInputs.set([]);
    this._clarificationAnswers.set([]);
    this.clearPersistedArtifacts();
    this.router.navigate(['/requirement-to-code'], { queryParams: {} });
  }

  setClarificationAnswer(index: number, value: string): void {
    const answers = [...this._clarificationAnswers()];
    answers[index] = value;
    this._clarificationAnswers.set(answers);
  }

  areClarificationAnswersValid(): boolean {
    return this.clarificationAnswersValid();
  }

  // ── Jira status ─────────────────────────────────────────────

  updateTaskStatus(taskId: string, status: TaskStatus): void {
    this._artifacts.update(current => {
      if (!current) return current;
      const updatedArtifacts: GeneratedArtifacts = {
        ...current,
        jiraTasks: current.jiraTasks.map(t =>
          t.id === taskId ? { ...t, status } : t
        )
      };
      this.persistArtifacts(updatedArtifacts, this.requirementText);
      return updatedArtifacts;
    });
  }

  private persistArtifacts(artifacts: GeneratedArtifacts, requirementText: string): void {
    try {
      const persistedState: PersistedRequirementToCodeState = {
        requirementText,
        artifacts
      };

      localStorage.setItem(
        RequirementToCodePageComponent.ARTIFACTS_STORAGE_KEY,
        JSON.stringify(persistedState)
      );
    } catch {
      // Ignore storage errors to avoid blocking the user flow.
    }
  }

  private restoreArtifacts(): void {
    try {
      const raw = localStorage.getItem(RequirementToCodePageComponent.ARTIFACTS_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as PersistedRequirementToCodeState | GeneratedArtifacts;
      const persistedState = this.isPersistedRequirementToCodeState(parsed)
        ? parsed
        : {
            requirementText: '',
            artifacts: parsed as GeneratedArtifacts
          };

      if (!persistedState.artifacts || !Array.isArray(persistedState.artifacts.files) || !Array.isArray(persistedState.artifacts.jiraTasks) || !Array.isArray(persistedState.artifacts.testCases)) {
        return;
      }

      this.requirementText = persistedState.requirementText;
      this._artifacts.set(persistedState.artifacts);
    } catch {
      this.clearPersistedArtifacts();
    }
  }

  private isPersistedRequirementToCodeState(
    value: PersistedRequirementToCodeState | GeneratedArtifacts | null | undefined
  ): value is PersistedRequirementToCodeState {
    return !!value && 'artifacts' in value && 'requirementText' in value;
  }

  private clearPersistedArtifacts(): void {
    try {
      localStorage.removeItem(RequirementToCodePageComponent.ARTIFACTS_STORAGE_KEY);
    } catch {
      // Ignore storage errors to avoid blocking the user flow.
    }
  }

  private handleGenerationError(err: unknown): void {
    const error = err as { message?: string };
    this._error.set(error?.message ?? 'Failed to generate artifacts. Please check your input and try again.');
    this._isGenerating.set(false);
    this.router.navigate(['/requirement-to-code'], { queryParams: {} });
  }

  statusSelectClass(status: TaskStatus): string {
    if (status === 'In Progress') return 'status-inprogress';
    if (status === 'Done')        return 'status-done';
    return 'status-todo';
  }

  // ── Helpers ─────────────────────────────────────────────────

  priorityClass(priority: string): string {
    if (priority === 'High' || priority === 'Critical') return 'chip-red';
    if (priority === 'Medium')                          return 'chip-yellow';
    return 'chip-green';
  }

  capitalize(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : '';
  }

  fileIcon(language: string): string {
    const lang = language?.toLowerCase() ?? '';
    if (lang.includes('typescript') || lang === 'ts') return 'code';
    if (lang.includes('html'))                         return 'html';
    if (lang.includes('css') || lang.includes('scss')) return 'palette';
    if (lang.includes('json'))                         return 'data_object';
    if (lang.includes('sql'))                          return 'storage';
    if (lang.includes('markdown') || lang === 'md')   return 'description';
    return 'article';
  }

  shortLang(language: string): string {
    const map: Record<string, string> = {
      typescript: 'TS', javascript: 'JS', html: 'HTML', scss: 'SCSS',
      css: 'CSS', json: 'JSON', sql: 'SQL', markdown: 'MD'
    };
    return map[language?.toLowerCase()] ?? language?.slice(0, 3)?.toUpperCase() ?? '?';
  }

  private normalizePriority(priority: string): 'High' | 'Medium' | 'Low' {
    if (priority === 'Critical' || priority === 'High') return 'High';
    if (priority === 'Low')                             return 'Low';
    return 'Medium';
  }
}
