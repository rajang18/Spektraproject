import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  computed, inject, NgZone, signal, ViewChild, ElementRef
} from '@angular/core';
import { DecimalPipe, NgClass, NgFor, NgIf, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LogAnalyzerService } from '../../services/log-analyzer.service';
import { LogAnalysisResponse } from '../../../../core/api/ai-api.models';

type PageView = 'input' | 'analyzing' | 'result';
type InputTab  = 'upload' | 'paste';
type Severity  = 'low' | 'medium' | 'high' | 'critical';

const ACCEPTED_EXTS = ['.log', '.txt', '.stack', '.cs', '.java', '.json', '.xml', '.yaml', '.yml'];
const MAX_CHARS     = 20_000;

@Component({
  selector: 'app-log-analyzer-page',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule, MatIconModule, DecimalPipe, UpperCasePipe],
  template: `
    <section class="page-frame">
      <h2 class="screen-title">{{ screenTitle() }}</h2>

      <div class="app-panel">

        <!-- ══════════════════════════ INPUT ══════════════════════════ -->
        <ng-container *ngIf="view() === 'input'">
          <div class="panel-body">
            <div class="page-heading">
              <div>
                <h1>AI Log Analyzer</h1>
                <p>Upload an error log file or paste your log text — AI will identify the root cause and suggest fixes</p>
              </div>
            </div>

            <!-- Tab bar -->
            <div class="log-tabs">
              <button
                class="log-tab"
                [class.active]="tab() === 'upload'"
                type="button"
                (click)="setTab('upload')"
              >
                <mat-icon>upload_file</mat-icon> Upload File
              </button>
              <button
                class="log-tab"
                [class.active]="tab() === 'paste'"
                type="button"
                (click)="setTab('paste')"
              >
                <mat-icon>content_paste</mat-icon> Paste Log
              </button>
            </div>

            <!-- ── Upload tab ── -->
            <ng-container *ngIf="tab() === 'upload'">
              <div
                class="upload-zone"
                [class.dz-active]="isDragging()"
                [class.dz-has-file]="!!fileName()"
                (dragover)="onDragOver($event)"
                (dragleave)="_isDragging.set(false)"
                (drop)="onDrop($event)"
                (click)="fileInput.click()"
              >
                <input
                  #fileInput
                  type="file"
                  [accept]="acceptAttr"
                  style="display:none"
                  (change)="onFileSelected($event)"
                />

                <ng-container *ngIf="!fileName(); else fileReady">
                  <div class="upload-icon-wrap">
                    <mat-icon>cloud_upload</mat-icon>
                  </div>
                  <p class="upload-title">Drag &amp; drop your log file here</p>
                  <p class="muted">or click to browse</p>
                  <span class="upload-hint">{{ acceptHint }}</span>
                </ng-container>

                <ng-template #fileReady>
                  <div class="file-ready-icon">
                    <mat-icon>check_circle</mat-icon>
                  </div>
                  <p class="upload-title file-ready-name">{{ fileName() }}</p>
                  <p class="muted">{{ fileSizeLabel() }} · click to choose a different file</p>
                </ng-template>
              </div>

              <p class="field-error" *ngIf="fileError()">
                <mat-icon>error_outline</mat-icon> {{ fileError() }}
              </p>
            </ng-container>

            <!-- ── Paste tab ── -->
            <ng-container *ngIf="tab() === 'paste'">
              <textarea
                class="form-textarea log-textarea"
                [ngModel]="_pasteContent()"
                (ngModelChange)="_pasteContent.set($event)"
                [maxlength]="MAX_CHARS"
                placeholder="Paste your error logs here…&#10;&#10;Example:&#10;ERROR 2024-05-12 UserService - NullReferenceException: Object reference not set to an instance of an object.&#10;  at UserService.GetUser(Int32 id) in UserService.cs:line 44"
              ></textarea>
              <div class="char-count" [class.char-warn]="_pasteContent().length > MAX_CHARS * 0.9">
                {{ _pasteContent().length | number }} / {{ MAX_CHARS | number }} characters
              </div>
            </ng-container>

            <!-- Environment + submit row -->
            <div class="input-footer">
              <div class="env-row">
                <label class="env-label">
                  <mat-icon>dns</mat-icon> Environment
                  <span class="muted">(optional)</span>
                </label>
                <select class="form-select env-select" [(ngModel)]="environment">
                  <option value="">All environments</option>
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>

              <div class="error-banner" *ngIf="apiError()">
                <mat-icon>error_outline</mat-icon> {{ apiError() }}
              </div>

              <div class="section-bar" style="margin-top:0">
                <span></span>
                <button
                  class="btn btn-primary"
                  type="button"
                  [disabled]="!canAnalyze()"
                  (click)="analyze()"
                >
                  <mat-icon>manage_search</mat-icon>
                  Analyze with AI
                </button>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- ══════════════════════════ ANALYZING ══════════════════════════ -->
        <ng-container *ngIf="view() === 'analyzing'">
          <div class="loader-panel" style="min-height:480px; display:grid; place-items:center; padding:48px 24px; background: radial-gradient(circle at 50% 22%,rgba(124,69,245,.15),transparent 18%),linear-gradient(120deg,#fafbff 0%,#f0e8ff 52%,#f8f6ff 100%)">
            <div class="loader-content">
              <div class="bot-ring"><div class="bot-face"></div></div>
              <div>
                <h1 class="section-title">AI is analyzing your logs…</h1>
                <p class="muted">Identifying root causes, severity, and generating<br />actionable recommendations — this may take up to 30 seconds.</p>
              </div>
              <div class="progress-track">
                <span class="progress-fill progress-pulse"></span>
              </div>
              <p class="muted">Analyzing — please wait…</p>
            </div>
          </div>
        </ng-container>

        <!-- ══════════════════════════ RESULT ══════════════════════════ -->
        <ng-container *ngIf="view() === 'result' && result()">

          <!-- Severity banner -->
          <div class="severity-banner" [ngClass]="'sev-' + result()!.severity">
            <div class="sev-left">
              <span class="sev-dot"></span>
              <span class="sev-label">{{ result()!.severity | uppercase }} severity</span>
              <span class="sev-summary">{{ result()!.summary }}</span>
            </div>
            <div class="sev-actions">
              <button class="btn btn-outline" type="button" (click)="reset()">
                <mat-icon>add_circle_outline</mat-icon> New Analysis
              </button>
              <button class="btn btn-retry" type="button" (click)="retry()" title="Re-run AI on the same log">
                <mat-icon>replay</mat-icon> Retry Response
              </button>
              <button
                class="btn"
                [class.btn-copied]="copied()"
                type="button"
                (click)="copyAnalysis()"
              >
                <mat-icon>{{ copied() ? 'check' : 'content_copy' }}</mat-icon>
                {{ copied() ? 'Copied!' : 'Copy' }}
              </button>
            </div>
          </div>

          <!-- Result grid -->
          <div class="result-grid">

            <!-- LEFT — summary card -->
            <aside class="result-sidebar">
              <h3 class="card-title">Analysis Summary</h3>

              <div class="summary-row">
                <span class="s-dot" [ngClass]="'sd-' + result()!.severity"></span>
                <div>
                  <strong>Severity</strong>
                  <p>{{ capitalize(result()!.severity) }}</p>
                </div>
              </div>

              <div class="summary-row">
                <span class="s-dot sd-red"></span>
                <div>
                  <strong>Root Cause</strong>
                  <p [innerHTML]="formatText(result()!.rootCause.evidence)"></p>
                </div>
              </div>

              <div class="log-preview-wrap">
                <h4 class="preview-label">Log Input Preview</h4>
                <pre class="log-preview-code">{{ logPreview() }}</pre>
              </div>
            </aside>

            <!-- RIGHT — rich analysis -->
            <section class="result-main">

              <!-- Log breakdown table -->
              <div class="result-section" *ngIf="result()!.logBreakdown?.length">
                <div class="result-section-header">
                  <mat-icon>table_rows</mat-icon>
                  <h3>Log Breakdown</h3>
                  <span class="count-badge">{{ result()!.logBreakdown.length }}</span>
                </div>
                <div class="signals-table-wrap">
                  <table class="data-table log-breakdown-table">
                    <thead>
                      <tr>
                        <th style="width:30%">Log</th>
                        <th style="width:35%">Meaning</th>
                        <th>Likely Cause</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let row of result()!.logBreakdown">
                        <td><code class="log-line-chip">{{ row.logLine }}</code></td>
                        <td class="signal-evidence">{{ row.meaning }}</td>
                        <td class="signal-evidence">{{ row.likelyCause }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Flow of the failure -->
              <div class="result-section" *ngIf="result()!.executionFlow?.length">
                <div class="result-section-header">
                  <mat-icon>alt_route</mat-icon>
                  <h3>Flow of the Failure</h3>
                </div>
                <div class="flow-chain">
                  <ng-container *ngFor="let step of result()!.executionFlow; let last = last">
                    <div class="flow-box" [innerHTML]="formatText(step)"></div>
                    <div class="flow-arrow" *ngIf="!last">
                      <mat-icon>arrow_downward</mat-icon>
                    </div>
                  </ng-container>
                </div>
              </div>

              <!-- Things to check -->
              <div class="result-section" *ngIf="result()!.thingsToCheck?.length">
                <div class="result-section-header">
                  <mat-icon>fact_check</mat-icon>
                  <h3>Things to Check</h3>
                  <span class="count-badge">{{ result()!.thingsToCheck.length }}</span>
                </div>
                <ol class="check-list">
                  <li *ngFor="let item of result()!.thingsToCheck; let i = index">
                    <div class="check-header">
                      <span class="rec-num">{{ i + 1 }}</span>
                      <h4 [innerHTML]="formatText(item.title)"></h4>
                    </div>
                    <ul class="check-steps" *ngIf="item.steps?.length">
                      <li *ngFor="let s of item.steps" [innerHTML]="formatText(s)"></li>
                    </ul>
                    <div class="code-block-wrap" *ngIf="item.codeSnippet">
                      <div class="code-block-header">
                        <span>{{ item.codeLanguage || 'code' }}</span>
                        <button class="code-copy-btn" type="button" (click)="copySnippet(item.codeSnippet)">
                          <mat-icon>{{ copiedSnippet() === item.codeSnippet ? 'check' : 'content_copy' }}</mat-icon>
                        </button>
                      </div>
                      <pre class="code-block"><code>{{ item.codeSnippet }}</code></pre>
                    </div>
                  </li>
                </ol>
              </div>

              <!-- Root cause detail -->
              <div class="result-section">
                <div class="result-section-header">
                  <mat-icon>bug_report</mat-icon>
                  <h3>Root Cause</h3>
                </div>
                <div class="root-cause-callout">
                  <blockquote class="rc-evidence">{{ result()!.rootCause.evidence }}</blockquote>
                  <p class="rc-explanation" [innerHTML]="formatText(result()!.rootCause.explanation)"></p>
                  <ng-container *ngIf="result()!.rootCause.consequences?.length">
                    <p class="rc-consequences-label">Everything else follows from this:</p>
                    <ul class="rc-consequences">
                      <li *ngFor="let c of result()!.rootCause.consequences" [innerHTML]="formatText(c)"></li>
                    </ul>
                  </ng-container>
                </div>
              </div>

              <div class="result-section">
                <div class="result-section-header">
                  <mat-icon>lightbulb</mat-icon>
                  <h3>AI Recommendations</h3>
                  <span class="count-badge">{{ result()!.recommendations.length }}</span>
                </div>
                <ol class="rec-list">
                  <li *ngFor="let rec of result()!.recommendations; let i = index">
                    <span class="rec-num">{{ i + 1 }}</span>
                    <p [innerHTML]="formatText(rec)"></p>
                  </li>
                </ol>
              </div>

              <div class="result-section" *ngIf="result()!.signals?.length">
                <div class="result-section-header">
                  <mat-icon>radar</mat-icon>
                  <h3>Detected Signals</h3>
                  <span class="count-badge">{{ result()!.signals.length }}</span>
                </div>
                <div class="signals-table-wrap">
                  <table class="data-table signals-table">
                    <thead>
                      <tr>
                        <th style="width:35%">Pattern</th>
                        <th>Evidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let s of result()!.signals">
                        <td><span class="signal-pattern">{{ s.pattern }}</span></td>
                        <td class="signal-evidence">{{ s.evidence }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </section>
          </div>
        </ng-container>

      </div>
    </section>
  `,
  styles: [`
    /* ── Tabs ───────────────────────────────────────────────── */
    .log-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
    }

    .log-tab {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 18px;
      border-radius: 8px;
      border: 1.5px solid var(--line);
      background: #fff;
      color: #687085;
      font-size: 0.86rem;
      font-weight: 600;
      cursor: pointer;
      transition: all .15s;
    }

    .log-tab mat-icon { font-size: 17px; }

    .log-tab.active {
      border-color: var(--purple);
      background: var(--purple-soft);
      color: var(--purple-strong);
    }

    /* ── Upload zone ─────────────────────────────────────────── */
    .upload-zone {
      min-height: 260px;
      border: 2px dashed var(--line);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 10px;
      padding: 32px;
      cursor: pointer;
      transition: border-color .15s, background .15s;
      background: #fafbff;
    }

    .upload-zone:hover { border-color: var(--purple); background: var(--purple-soft); }
    .upload-zone.dz-active { border-color: var(--purple); background: #ece6ff; }
    .upload-zone.dz-has-file { border-style: solid; border-color: #6dd8a8; background: #edfff5; }

    .upload-icon-wrap {
      width: 64px; height: 64px;
      border-radius: 16px;
      background: var(--purple-soft);
      color: var(--purple);
      display: grid; place-items: center;
    }

    .upload-icon-wrap mat-icon { font-size: 28px; }

    .upload-title { margin: 0; font-size: 1rem; font-weight: 700; color: #253044; }
    .upload-hint {
      font-size: 0.76rem; color: #9098b0;
      background: #f0eeff; border-radius: 4px; padding: 3px 8px;
    }

    .file-ready-icon { color: #23b26d; }
    .file-ready-icon mat-icon { font-size: 40px; }
    .file-ready-name { color: #167a4d !important; }

    .field-error {
      display: flex; align-items: center; gap: 6px;
      color: #c53030; font-size: 0.83rem; margin-top: 8px;
    }
    .field-error mat-icon { font-size: 16px; }

    /* ── Log textarea ────────────────────────────────────────── */
    .log-textarea {
      min-height: 280px;
      font-family: Consolas, 'Courier New', monospace;
      font-size: 0.83rem;
      line-height: 1.6;
    }

    .char-count { text-align: right; margin-top: -26px; padding-right: 12px; color: #7d8497; font-size: 0.75rem; }
    .char-warn  { color: #c05621; }

    /* ── Input footer ────────────────────────────────────────── */
    .input-footer { margin-top: 24px; display: flex; flex-direction: column; gap: 16px; }

    .env-row {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    }

    .env-label {
      display: flex; align-items: center; gap: 5px;
      font-size: 0.86rem; font-weight: 700; color: #253044; white-space: nowrap;
    }
    .env-label mat-icon { font-size: 16px; color: #687085; }

    .env-select { max-width: 220px; min-height: 36px; }

    .error-banner {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; background: #fff5f5;
      border: 1px solid #ffcccc; border-radius: 8px; color: #c53030; font-size: 14px;
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

    /* ── Severity banner ─────────────────────────────────────── */
    .severity-banner {
      display: flex; align-items: center; justify-content: space-between;
      gap: 16px; flex-wrap: wrap;
      padding: 14px 24px; border-bottom: 1px solid var(--line);
    }

    .sev-left  { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
    .sev-actions { display: flex; gap: 8px; flex-shrink: 0; }

    .sev-dot {
      width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0;
    }
    .sev-label {
      font-size: 0.82rem; font-weight: 800; letter-spacing: .04em;
      text-transform: uppercase;
    }
    .sev-summary {
      font-size: 0.86rem; color: #253044;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 480px;
    }

    /* Severity colour tokens */
    .sev-critical .sev-dot { background: #e53e3e; }
    .sev-critical .sev-label { color: #e53e3e; }
    .sev-critical { background: #fff5f5; }

    .sev-high .sev-dot { background: #e67e22; }
    .sev-high .sev-label { color: #e67e22; }
    .sev-high { background: #fff8f0; }

    .sev-medium .sev-dot { background: #e4ad24; }
    .sev-medium .sev-label { color: #a97600; }
    .sev-medium { background: #fffbeb; }

    .sev-low .sev-dot { background: #23b26d; }
    .sev-low .sev-label { color: #167a4d; }
    .sev-low { background: #f0fff8; }

    .btn-copied { background: #23b26d; color: #fff; border-color: #23b26d; }

    .btn-retry {
      background: #fff;
      color: var(--purple-strong, #5b3fd1);
      border-color: var(--purple, #6c5ce7);
    }
    .btn-retry:hover { background: var(--purple-soft, #ece6ff); }
    .btn-retry mat-icon { font-size: 16px; }

    /* ── Result grid ─────────────────────────────────────────── */
    .result-grid {
      display: grid;
      grid-template-columns: 280px 1fr;
      min-height: 400px;
    }

    .result-sidebar {
      border-right: 1px solid var(--line);
      padding: 20px 18px;
      background: #fbfcff;
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 0;
    }

    .card-title { margin: 0; font-size: 0.95rem; font-weight: 800; }

    .summary-row {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 12px; background: #fff; border: 1px solid var(--line); border-radius: 8px;
      min-width: 0;
    }

    .s-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
    .sd-critical, .sd-red { background: #e53e3e; }
    .sd-high     { background: #e67e22; }
    .sd-medium   { background: #e4ad24; }
    .sd-low, .sd-green { background: #23b26d; }

    .summary-row strong { display: block; font-size: 0.82rem; font-weight: 700; color: #253044; margin-bottom: 4px; }
    .summary-row p { margin: 0; font-size: 0.81rem; color: var(--muted); line-height: 1.55; word-break: break-word; }

    .log-preview-wrap { margin-top: 4px; min-width: 0; }
    .preview-label { margin: 0 0 8px; font-size: 0.8rem; font-weight: 700; color: #687085; text-transform: uppercase; letter-spacing: .04em; }

    .log-preview-code {
      margin: 0; padding: 10px 12px;
      background: #0d1117; color: #adbac7;
      font-family: Consolas, monospace; font-size: 0.72rem; line-height: 1.55;
      border-radius: 6px; overflow: auto; max-height: 200px;
      white-space: pre; word-break: normal;
    }

    /* ── Result main ─────────────────────────────────────────── */
    .result-main {
      padding: 20px 24px;
      display: flex; flex-direction: column; gap: 24px;
      min-width: 0; overflow: hidden;
    }

    .result-section-header {
      display: flex; align-items: center; gap: 8px; margin-bottom: 14px; flex-wrap: wrap;
    }
    .result-section-header mat-icon { color: var(--purple); font-size: 20px; }
    .result-section-header h3 { margin: 0; font-size: 0.95rem; font-weight: 800; }

    .count-badge {
      margin-left: auto;
      font-size: 0.72rem; font-weight: 700;
      background: #e8e3ff; color: #5b3fd1;
      border-radius: 999px; padding: 2px 8px;
    }

    .rec-list {
      list-style: none; margin: 0; padding: 0;
      display: flex; flex-direction: column; gap: 10px;
    }

    .rec-list li {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 12px 14px; background: #f8f9ff;
      border-radius: 8px; border-left: 3px solid var(--purple);
      min-width: 0;
    }
    .rec-list li p {
      margin: 0; font-size: 0.85rem; line-height: 1.65; color: #253044;
      word-break: break-word; min-width: 0; flex: 1;
    }

    .rec-num {
      display: flex; align-items: center; justify-content: center;
      min-width: 22px; height: 22px;
      background: var(--purple); color: #fff;
      border-radius: 50%; font-size: 0.72rem; font-weight: 700; flex-shrink: 0;
      margin-top: 1px;
    }

    /* ── Command chip (rendered via [innerHTML]) ─────────────── */
    :host ::ng-deep .cmd-chip {
      display: inline;
      font-family: Consolas, 'Courier New', monospace;
      font-size: 0.80rem;
      font-weight: 600;
      background: #1e1e2e;
      color: #a6e3a1;
      border: 1px solid #313244;
      border-radius: 5px;
      padding: 1px 6px;
      margin: 0 2px;
      word-break: break-all;
      vertical-align: middle;
      line-height: 1.7;
    }

    :host ::ng-deep .result-main strong,
    :host ::ng-deep .summary-row p strong {
      color: #253044;
      font-weight: 800;
    }

    .signals-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 6px; }
    .signals-table { width: 100%; }

    .signal-pattern {
      display: inline-block;
      font-family: Consolas, monospace; font-size: 0.8rem;
      background: #f0eeff; color: #5b3fd1; border-radius: 4px; padding: 2px 7px;
      white-space: nowrap;
    }

    .signal-evidence { font-size: 0.83rem; color: #334052; line-height: 1.5; word-break: break-word; }

    /* ── Log breakdown table ─────────────────────────────────── */
    .log-line-chip {
      display: inline-block;
      font-family: Consolas, monospace; font-size: 0.76rem;
      background: #0d1117; color: #ff8a8a;
      border-radius: 4px; padding: 3px 7px;
      word-break: break-word; line-height: 1.5;
    }

    /* ── Flow of the failure ─────────────────────────────────── */
    .flow-chain {
      display: flex; flex-direction: column; align-items: center;
      gap: 0; padding: 8px 0;
    }

    .flow-box {
      width: 100%; max-width: 420px;
      padding: 12px 18px;
      background: #f8f9ff; border: 1.5px solid var(--purple);
      border-radius: 10px;
      font-size: 0.85rem; font-weight: 600; color: #253044;
      text-align: center;
      box-shadow: 0 1px 2px rgba(108, 92, 231, 0.08);
    }

    .flow-arrow {
      color: var(--purple); display: flex; justify-content: center;
      margin: 2px 0;
    }
    .flow-arrow mat-icon { font-size: 20px; }

    /* ── Things to check ─────────────────────────────────────── */
    .check-list {
      list-style: none; margin: 0; padding: 0;
      display: flex; flex-direction: column; gap: 14px;
    }

    .check-list > li {
      padding: 14px 16px;
      background: #f8f9ff; border-radius: 10px;
      border-left: 3px solid var(--purple);
      min-width: 0;
    }

    .check-header {
      display: flex; align-items: center; gap: 10px;
    }
    .check-header h4 { margin: 0; font-size: 0.88rem; font-weight: 800; color: #253044; }

    .check-steps {
      margin: 10px 0 0; padding-left: 0;
      list-style: none;
      display: flex; flex-direction: column; gap: 6px;
    }
    .check-steps li {
      position: relative; padding-left: 18px;
      font-size: 0.83rem; color: #334052; line-height: 1.6;
    }
    .check-steps li::before {
      content: ''; position: absolute; left: 4px; top: 9px;
      width: 5px; height: 5px; border-radius: 50%;
      background: var(--purple);
    }

    /* ── Code block (things-to-check snippets) ───────────────── */
    .code-block-wrap {
      margin-top: 12px;
      border-radius: 8px; overflow: hidden;
      border: 1px solid #26262f;
    }

    .code-block-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 6px 12px;
      background: #1e1e2e; color: #9098b0;
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
    }

    .code-copy-btn {
      display: flex; align-items: center; justify-content: center;
      background: none; border: none; color: #9098b0; cursor: pointer;
      padding: 2px; border-radius: 4px;
      transition: color .15s, background .15s;
    }
    .code-copy-btn:hover { color: #fff; background: rgba(255,255,255,.08); }
    .code-copy-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .code-block {
      margin: 0; padding: 12px 14px;
      background: #0d1117; color: #d4d4e0;
      font-family: Consolas, 'Courier New', monospace; font-size: 0.78rem; line-height: 1.6;
      overflow-x: auto; white-space: pre;
    }

    /* ── Root cause callout ──────────────────────────────────── */
    .root-cause-callout {
      background: #fff5f5; border: 1px solid #ffd6d6; border-radius: 10px;
      padding: 16px 18px;
    }

    .rc-evidence {
      margin: 0 0 10px; padding: 0 0 0 14px;
      border-left: 3px solid #e53e3e;
      font-family: Consolas, monospace; font-size: 0.83rem; color: #9b2c2c;
      font-style: normal; line-height: 1.6; word-break: break-word;
    }

    .rc-explanation { margin: 0; font-size: 0.85rem; color: #253044; line-height: 1.65; }

    .rc-consequences-label {
      margin: 14px 0 6px; font-size: 0.8rem; font-weight: 700; color: #687085;
    }

    .rc-consequences {
      margin: 0; padding-left: 0; list-style: none;
      display: flex; flex-direction: column; gap: 6px;
    }
    .rc-consequences li {
      position: relative; padding-left: 18px;
      font-size: 0.83rem; color: #334052; line-height: 1.6;
    }
    .rc-consequences li::before {
      content: ''; position: absolute; left: 4px; top: 9px;
      width: 5px; height: 5px; border-radius: 50%;
      background: #e53e3e;
    }

    /* ── Responsive ──────────────────────────────────────────── */

    /* Tablet — sidebar collapses above content */
    @media (max-width: 960px) {
      .result-grid {
        grid-template-columns: 1fr;
      }
      .result-sidebar {
        border-right: 0;
        border-bottom: 1px solid var(--line);
        flex-direction: row;
        flex-wrap: wrap;
        gap: 12px;
      }
      .result-sidebar .card-title { width: 100%; }
      .result-sidebar .summary-row { flex: 1 1 260px; }
      .result-sidebar .log-preview-wrap { width: 100%; }
      .sev-summary { max-width: 340px; }
    }

    /* Large phone */
    @media (max-width: 680px) {
      .severity-banner {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 16px;
      }
      .sev-left { width: 100%; }
      .sev-summary { display: none; }
      .sev-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        width: 100%;
      }
      .sev-actions .btn {
        justify-content: center;
        font-size: 0.80rem;
        padding: 7px 10px;
      }
      .result-sidebar {
        flex-direction: column;
        padding: 16px 14px;
      }
      .result-sidebar .summary-row { flex: 1 1 auto; }
      .result-main { padding: 16px 14px; }
      .log-tabs { flex-wrap: wrap; }
      .rec-list li { flex-wrap: nowrap; padding: 10px 12px; }
    }

    /* Small phone */
    @media (max-width: 440px) {
      .sev-actions {
        grid-template-columns: 1fr;
      }
      :host ::ng-deep .cmd-chip {
        word-break: break-all;
        white-space: normal;
      }
      .result-main { padding: 12px 10px; gap: 18px; }
      .log-preview-code { max-height: 140px; font-size: 0.68rem; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogAnalyzerPageComponent {
  private readonly service   = inject(LogAnalyzerService);
  private readonly ngZone    = inject(NgZone);
  private readonly cdr       = inject(ChangeDetectorRef);
  private readonly sanitizer = inject(DomSanitizer);

  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  // ── State signals ──────────────────────────────────────────
  readonly _view       = signal<PageView>('input');
  readonly _tab        = signal<InputTab>('upload');
  readonly _isDragging = signal(false);
  readonly _fileName   = signal<string | null>(null);
  readonly _fileSize   = signal<number>(0);
  readonly _logContent = signal<string>('');    // from file
  readonly _fileError  = signal<string | null>(null);
  readonly _apiError   = signal<string | null>(null);
  readonly _result          = signal<LogAnalysisResponse | null>(null);
  readonly _copied          = signal(false);
  readonly _copiedSnippet   = signal<string | null>(null);
  readonly _isRetrying      = signal(false);

  // kept so Retry can re-submit without re-reading the file
  private _lastLogContent   = '';
  private _lastEnvironment  = '';

  // ── Paste content as signal so computed() can track it ─────
  readonly _pasteContent = signal('');

  // ── Environment is only read at submit time — plain prop OK ─
  environment = '';

  // ── Constants exposed to template ──────────────────────────
  readonly MAX_CHARS  = MAX_CHARS;
  readonly acceptAttr = ACCEPTED_EXTS.join(',');
  readonly acceptHint = ACCEPTED_EXTS.join(' · ');

  // ── Computed ────────────────────────────────────────────────
  readonly view      = computed(() => this._view());
  readonly tab       = computed(() => this._tab());
  readonly isDragging = computed(() => this._isDragging());
  readonly fileName  = computed(() => this._fileName());
  readonly fileError = computed(() => this._fileError());
  readonly apiError  = computed(() => this._apiError());
  readonly result    = computed(() => this._result());
  readonly copied    = computed(() => this._copied());
  readonly copiedSnippet = computed(() => this._copiedSnippet());

  readonly fileSizeLabel = computed(() => {
    const bytes = this._fileSize();
    if (bytes < 1024)      return `${bytes} B`;
    if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  });

  readonly canAnalyze = computed(() => {
    if (this._tab() === 'upload') return !!this._logContent().trim();
    return this._pasteContent().trim().length >= 10;
  });

  readonly screenTitle = computed(() =>
    this._view() === 'result'
      ? '11. AI Log Analyzer — Analysis Result'
      : '10. AI Log Analyzer — Log Input'
  );

  readonly logPreview = computed(() => {
    const content = this._tab() === 'upload' ? this._logContent() : this._pasteContent();
    const lines = content.split('\n').slice(0, 25);
    return lines.join('\n');
  });

  // ── Tab switching ───────────────────────────────────────────
  setTab(t: InputTab): void {
    this._tab.set(t);
    this._fileError.set(null);
    this._apiError.set(null);
  }

  // ── File upload ─────────────────────────────────────────────
  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this._isDragging.set(true);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this._isDragging.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) this.readFile(file);
  }

  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (file) this.readFile(file);
    input.value = '';   // reset so re-selecting same file triggers change
  }

  private readFile(file: File): void {
    this._fileError.set(null);

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_EXTS.includes(ext)) {
      this._fileError.set(`Unsupported file type "${ext}". Allowed: ${ACCEPTED_EXTS.join(', ')}`);
      return;
    }

    if (file.size > 2 * 1_048_576) {
      this._fileError.set('File exceeds the 2 MB limit. Please trim the log or paste it instead.');
      return;
    }

    this._fileName.set(file.name);
    this._fileSize.set(file.size);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = (ev.target?.result as string) ?? '';
      this.ngZone.run(() => {
        this._logContent.set(content.slice(0, MAX_CHARS));
        this.cdr.markForCheck();
      });
    };
    reader.readAsText(file);
  }

  // ── Analyze ─────────────────────────────────────────────────
  analyze(): void {
    const logContent = this._tab() === 'upload'
      ? this._logContent()
      : this._pasteContent();

    if (!logContent.trim()) return;

    // persist so retry() can reuse without touching input state
    this._lastLogContent  = logContent.trim();
    this._lastEnvironment = this.environment;

    this._callApi(this._lastLogContent, this._lastEnvironment);
  }

  // ── Retry — same prompt, fresh AI response ───────────────────
  retry(): void {
    if (!this._lastLogContent) return;
    this._isRetrying.set(true);
    this._callApi(this._lastLogContent, this._lastEnvironment);
  }

  private _callApi(logContent: string, environment: string): void {
    this._view.set('analyzing');
    this._apiError.set(null);

    this.service.analyze({
      logContent,
      environment: environment || undefined
    }).subscribe({
      next: (res) => {
        this._result.set(res);
        this._view.set('result');
        this._isRetrying.set(false);
      },
      error: (err) => {
        this._apiError.set(
          err?.message ?? 'Analysis failed. Please check your connection and try again.'
        );
        this._view.set(this._isRetrying() ? 'result' : 'input');
        this._isRetrying.set(false);
      }
    });
  }

  // ── Reset ────────────────────────────────────────────────────
  reset(): void {
    this._view.set('input');
    this._result.set(null);
    this._apiError.set(null);
    this._fileError.set(null);
    this._fileName.set(null);
    this._logContent.set('');
    this._fileSize.set(0);
    this._pasteContent.set('');
    this.environment = '';
  }

  // ── Copy analysis ─────────────────────────────────────────────
  async copyAnalysis(): Promise<void> {
    const r = this._result();
    if (!r) return;

    const text = [
      `SEVERITY: ${r.severity.toUpperCase()}`,
      `SUMMARY: ${r.summary}`,
      ...(r.logBreakdown?.length
        ? ['', 'LOG BREAKDOWN:', ...r.logBreakdown.map(row => `- ${row.logLine}\n  Meaning: ${row.meaning}\n  Likely cause: ${row.likelyCause}`)]
        : []),
      ...(r.executionFlow?.length
        ? ['', 'FLOW OF THE FAILURE:', ...r.executionFlow.map((step, i) => `${i + 1}. ${step}`)]
        : []),
      ...(r.thingsToCheck?.length
        ? ['', 'THINGS TO CHECK:', ...r.thingsToCheck.map((item, i) =>
            [`${i + 1}. ${item.title}`, ...item.steps.map(s => `   - ${s}`), ...(item.codeSnippet ? [item.codeSnippet] : [])].join('\n'))]
        : []),
      '',
      'ROOT CAUSE:',
      r.rootCause.evidence,
      r.rootCause.explanation,
      ...(r.rootCause.consequences?.length ? r.rootCause.consequences.map(c => `- ${c}`) : []),
      '',
      `AI RECOMMENDATIONS:`,
      ...r.recommendations.map((rec, i) => `${i + 1}. ${rec}`),
      ...(r.signals?.length
        ? ['', 'DETECTED SIGNALS:', ...r.signals.map(s => `- Pattern: ${s.pattern}\n  Evidence: ${s.evidence}`)]
        : [])
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      this._copied.set(true);
      setTimeout(() => this._copied.set(false), 2500);
    } catch {
      // clipboard not available — silently ignore
    }
  }

  // ── Copy a single code snippet from "Things to Check" ────────
  async copySnippet(snippet: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(snippet);
      this._copiedSnippet.set(snippet);
      setTimeout(() => this._copiedSnippet.set(null), 2000);
    } catch {
      // clipboard not available — silently ignore
    }
  }

  // ── Inline markdown → safe HTML ──────────────────────────────
  // Converts `command` → styled chip, **text** → <strong>
  formatText(raw: string): SafeHtml {
    const html = raw
      // backtick spans → command chip
      .replace(/`([^`]+)`/g, '<code class="cmd-chip">$1</code>')
      // **bold** → <strong>
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // ── Helpers ──────────────────────────────────────────────────
  capitalize(v: string): string {
    return v ? v.charAt(0).toUpperCase() + v.slice(1) : '';
  }
}
