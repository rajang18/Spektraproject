import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AiApiService } from '../../../../core/api/ai-api.service';
import {
  KnowledgeChatResponse,
  KnowledgeConversationHistory,
  KnowledgeConversationSummary,
  KnowledgeStatusResponse,
  KnowledgeZipOption
} from '../../../../core/api/ai-api.models';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  response?: KnowledgeChatResponse;
  isStreaming?: boolean;
}

@Component({
  selector: 'app-knowledge-copilot-page',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule, RouterLink, MatIconModule],
  template: `
    <section class="page-frame">
      <h2 class="screen-title">Knowledge Mode - Project Engineering Copilot</h2>

      <div class="app-panel">
        <div class="panel-body">
          <div class="page-heading">
            <div>
              <h1>C3 Project Knowledge Copilot</h1>
              <p>Ask architecture, component, service, API, routing, guard, or bug-fix questions from your indexed project source.</p>
            </div>
            <div class="mode-switch">
              <a class="btn btn-outline" routerLink="/requirement-to-code"><mat-icon>terminal</mat-icon> Requirement Mode</a>
              <button class="btn btn-outline" type="button" (click)="refreshStatus()"><mat-icon>sync</mat-icon> Refresh Status</button>
              <button class="btn btn-primary" type="button" (click)="reindex()" [disabled]="reindexing()"><mat-icon>manage_search</mat-icon> {{ reindexing() ? 'Reindexing...' : 'Reindex Project' }}</button>
            </div>
          </div>

          <div class="status-row" *ngIf="status() as st">
            <span class="chip" [ngClass]="st.zipExists ? 'chip-green' : 'chip-red'">{{ st.zipExists ? 'ZIP Ready' : 'ZIP Missing' }}</span>
            <span class="chip chip-blue">Files: {{ st.fileCount }}</span>
            <span class="chip chip-blue">Chunks: {{ st.chunkCount }}</span>
            <span class="muted">Indexed: {{ st.indexedAt || 'Not indexed yet' }}</span>
          </div>

          <div class="zip-row">
            <label class="session-label" for="zipPicker">Source ZIP</label>
            <select
              id="zipPicker"
              class="session-select"
              [ngModel]="selectedZipName()"
              (ngModelChange)="onZipChoiceChange($event)"
              [disabled]="switchingZip() || reindexing()"
            >
              <option *ngFor="let zip of zipOptions()" [ngValue]="zip.name">
                {{ zip.name }}
              </option>
            </select>
            <button
              class="btn btn-outline"
              type="button"
              (click)="applyZipSelection()"
              [disabled]="!canApplyZipSelection()"
            >
              <mat-icon>dataset_linked</mat-icon>
              {{ switchingZip() ? 'Switching...' : 'Apply ZIP' }}
            </button>
            <span class="muted" *ngIf="activeZipName()">Active: {{ activeZipName() }}</span>
          </div>

          <div class="session-row">
            <label class="session-label" for="sessionPicker">Session</label>
            <select
              id="sessionPicker"
              class="session-select"
              [ngModel]="activeConversationId()"
              (ngModelChange)="onConversationChange($event)"
              [disabled]="loadingConversations()"
            >
              <option *ngFor="let item of conversations()" [ngValue]="item.conversationId">
                {{ item.conversationId }} ({{ item.turnCount }} turns)
              </option>
            </select>
            <button class="btn btn-outline" type="button" (click)="createNewConversation()">
              <mat-icon>add_circle</mat-icon>
              New Session
            </button>
            <span class="muted" *ngIf="loadingConversations()">Loading sessions...</span>
          </div>

          <div class="knowledge-layout">
            <div class="chat-window">
              <div class="chat-empty" *ngIf="messages().length === 0">
                <mat-icon>psychology</mat-icon>
                <p>Start by asking something like "Trace auth token flow" or "Find all usages of OrderService".</p>
              </div>

              <div class="chat-message" *ngFor="let message of messages()" [ngClass]="message.role">
                <div class="chat-bubble">
                  <div class="chat-meta">{{ message.role === 'user' ? 'You' : 'Copilot' }} - {{ message.timestamp }}</div>
                  <pre class="chat-content">{{ message.content }}</pre>
                  <p class="streaming-label" *ngIf="message.isStreaming">Streaming response...</p>

                  <div class="response-meta" *ngIf="message.response as r">
                    <div><strong>Summary:</strong> {{ r.summary }}</div>
                    <div><strong>Confidence:</strong> {{ r.confidence }}</div>
                    <div><strong>Retrieved Chunks:</strong> {{ r.search.retrievedChunks }}</div>
                    <div><strong>Files Used:</strong> {{ r.filesUsed.length }}</div>
                  </div>

                  <div class="file-list" *ngIf="message.response as response">
                    <h4>Files Used</h4>
                    <ul *ngIf="response.filesUsed.length">
                      <li *ngFor="let file of response.filesUsed">
                        <button type="button" class="file-link" (click)="openCitation(file.path, file.chunk, response)">
                          {{ file.path }} (score: {{ file.score }}, chunk: {{ file.chunk }})
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <aside class="code-viewer">
              <div class="code-viewer__header">
                <h3>Code Viewer</h3>
                <span class="muted" *ngIf="selectedFilePath()">{{ selectedFilePath() }}</span>
              </div>

              <p class="muted" *ngIf="selectedFileChunk()">Selected chunk: {{ selectedFileChunk() }}</p>
              <div class="code-viewer__loading" *ngIf="loadingFile()">Loading file...</div>

              <pre class="code-viewer__content" *ngIf="selectedFileContent(); else noFileSelected">
<code [innerHTML]="highlightedCodeHtml()"></code>
              </pre>
              <ng-template #noFileSelected>
                <div class="code-viewer__empty">
                  Click a file citation from the response to open its code here.
                </div>
              </ng-template>
            </aside>
          </div>

          <div class="error-banner" *ngIf="error()">
            <mat-icon>error_outline</mat-icon>
            <span>{{ error() }}</span>
          </div>

          <div class="composer">
            <textarea
              class="form-textarea"
              [(ngModel)]="question"
              placeholder="Ask about your project architecture, modules, services, APIs, routing, auth, build errors, or bug fixes..."
            ></textarea>
            <div class="section-bar">
              <span class="muted">Conversation: {{ activeConversationId() }}</span>
              <button
                class="btn btn-outline"
                type="button"
                *ngIf="sending()"
                (click)="cancelStream()"
              >
                <mat-icon>stop_circle</mat-icon>
                Cancel Stream
              </button>
              <button class="btn btn-primary" type="button" (click)="send()" [disabled]="!question.trim() || sending()">
                <mat-icon>send</mat-icon>
                {{ sending() ? 'Thinking...' : 'Ask Copilot' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .mode-switch { display: flex; gap: 8px; flex-wrap: wrap; }
    .status-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin: 0 0 14px; }
    .session-row {
      display: flex;
      gap: 10px;
      align-items: center;
      margin: 0 0 14px;
      flex-wrap: wrap;
    }
    .zip-row {
      display: flex;
      gap: 10px;
      align-items: center;
      margin: 0 0 14px;
      flex-wrap: wrap;
    }
    .session-label { font-size: 13px; color: #374151; font-weight: 600; }
    .session-select {
      min-width: 280px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 6px 10px;
      background: #fff;
      color: #1f2937;
    }
    .knowledge-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 420px;
      gap: 14px;
      align-items: start;
    }
    .chat-window {
      border: 1px solid var(--line);
      border-radius: 10px;
      min-height: 360px;
      max-height: 560px;
      overflow: auto;
      background: #fafbff;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .chat-empty {
      display: grid;
      place-items: center;
      min-height: 280px;
      color: var(--muted);
      text-align: center;
      gap: 8px;
    }
    .chat-message { display: flex; }
    .chat-message.user { justify-content: flex-end; }
    .chat-message.assistant { justify-content: flex-start; }
    .chat-bubble {
      width: min(900px, 92%);
      border-radius: 10px;
      padding: 12px;
      border: 1px solid var(--line);
      background: #fff;
    }
    .chat-message.user .chat-bubble {
      background: #f0ecff;
      border-color: #d9cbff;
    }
    .chat-meta { font-size: 12px; color: var(--muted); margin-bottom: 6px; }
    .chat-content {
      margin: 0;
      white-space: pre-wrap;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.55;
    }
    .streaming-label {
      margin: 8px 0 0;
      font-size: 12px;
      color: #5b3fd1;
      font-weight: 600;
    }
    .response-meta {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px dashed var(--line);
      font-size: 12px;
      color: #455066;
      display: grid;
      gap: 4px;
    }
    .file-list { margin-top: 8px; font-size: 12px; }
    .file-list h4 { margin: 0 0 6px; font-size: 13px; }
    .file-list ul { margin: 0; padding-left: 16px; }
    .file-link {
      border: 0;
      background: transparent;
      padding: 0;
      margin: 0;
      color: #5b3fd1;
      text-decoration: underline;
      cursor: pointer;
      font-size: 12px;
      text-align: left;
    }

    .code-viewer {
      border: 1px solid var(--line);
      border-radius: 10px;
      background: #fff;
      min-height: 360px;
      max-height: 560px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .code-viewer__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      background: #fafbff;
    }

    .code-viewer__header h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
    }

    .code-viewer__loading {
      padding: 10px 12px;
      font-size: 12px;
      color: #5b3fd1;
      border-bottom: 1px dashed var(--line);
    }

    .code-viewer__content {
      margin: 0;
      flex: 1;
      overflow: auto;
      background: #0d1117;
      color: #e6edf3;
      padding: 14px;
      font-size: 12px;
      line-height: 1.55;
      white-space: pre;
    }
    .code-viewer__content code { font-family: Consolas, Monaco, 'Courier New', monospace; }
    :host ::ng-deep .code-line { display: grid; grid-template-columns: 42px 1fr; gap: 10px; }
    :host ::ng-deep .code-lineno { color: #6e7681; text-align: right; user-select: none; }
    :host ::ng-deep .code-token-keyword { color: #ff7b72; }
    :host ::ng-deep .code-token-string { color: #a5d6ff; }
    :host ::ng-deep .code-token-comment { color: #8b949e; font-style: italic; }
    :host ::ng-deep .code-token-number { color: #79c0ff; }
    :host ::ng-deep .code-token-tag { color: #7ee787; }
    :host ::ng-deep .code-token-attr { color: #d2a8ff; }

    .code-viewer__empty {
      padding: 14px;
      color: var(--muted);
      font-size: 13px;
    }

    @media (max-width: 1200px) {
      .knowledge-layout {
        grid-template-columns: 1fr;
      }

      .code-viewer {
        max-height: 420px;
      }
    }
    .composer { margin-top: 14px; }
    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      color: #c53030;
      background: #fff5f5;
      border: 1px solid #ffcccc;
      border-radius: 8px;
      padding: 10px 12px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KnowledgeCopilotPageComponent implements OnDestroy {
  private readonly api = inject(AiApiService);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly _activeConversationId = signal(this.nextConversationId());
  question = '';

  private messageIdCounter = 0;
  private stopStream: (() => void) | null = null;

  private readonly _messages = signal<ChatMessage[]>([]);
  private readonly _sending = signal(false);
  private readonly _reindexing = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _status = signal<KnowledgeStatusResponse | null>(null);
  private readonly _zipOptions = signal<KnowledgeZipOption[]>([]);
  private readonly _selectedZipName = signal<string | null>(null);
  private readonly _activeZipName = signal<string | null>(null);
  private readonly _switchingZip = signal(false);
  private readonly _conversations = signal<KnowledgeConversationSummary[]>([]);
  private readonly _loadingConversations = signal(false);
  private readonly _activeAssistantMessageId = signal<number | null>(null);
  private readonly _selectedFilePath = signal<string | null>(null);
  private readonly _selectedFileContent = signal<string>('');
  private readonly _selectedFileChunk = signal<string>('');
  private readonly _loadingFile = signal(false);

  readonly messages = computed(() => this._messages());
  readonly sending = computed(() => this._sending());
  readonly reindexing = computed(() => this._reindexing());
  readonly error = computed(() => this._error());
  readonly status = computed(() => this._status());
  readonly zipOptions = computed(() => this._zipOptions());
  readonly selectedZipName = computed(() => this._selectedZipName());
  readonly activeZipName = computed(() => this._activeZipName());
  readonly switchingZip = computed(() => this._switchingZip());
  readonly canApplyZipSelection = computed(() => {
    const selected = this._selectedZipName();
    const active = this._activeZipName();
    return !!selected && selected !== active && !this._switchingZip();
  });
  readonly activeConversationId = computed(() => this._activeConversationId());
  readonly conversations = computed(() => this._conversations());
  readonly loadingConversations = computed(() => this._loadingConversations());
  readonly selectedFilePath = computed(() => this._selectedFilePath());
  readonly selectedFileContent = computed(() => this._selectedFileContent());
  readonly selectedFileChunk = computed(() => this._selectedFileChunk());
  readonly selectedCodeLanguage = computed(() => this.detectCodeLanguage(this._selectedFilePath()));
  readonly highlightedCodeHtml = computed(() =>
    this.renderHighlightedCode(this._selectedFileContent(), this.selectedCodeLanguage())
  );
  readonly loadingFile = computed(() => this._loadingFile());

  constructor() {
    this.refreshStatus();
    this.loadZipOptions();
    this.loadConversations(this._activeConversationId());
  }

  ngOnDestroy(): void {
    this.stopStream?.();
  }

  send(): void {
    const text = this.question.trim();
    if (!text || this._sending()) {
      return;
    }

    const now = new Date().toLocaleTimeString();
    const userMessageId = ++this.messageIdCounter;
    const assistantMessageId = ++this.messageIdCounter;
    this._messages.update((messages) => [
      ...messages,
      { id: userMessageId, role: 'user', content: text, timestamp: now },
      { id: assistantMessageId, role: 'assistant', content: '', timestamp: now, isStreaming: true }
    ]);
    this.question = '';
    this._error.set(null);
    this._sending.set(true);
    this._activeAssistantMessageId.set(assistantMessageId);

    this.stopStream?.();
    this.stopStream = this.api.streamKnowledgeChat(
      { question: text, conversationId: this._activeConversationId() },
      {
        onDelta: ({ chunk }) => {
          this._messages.update((messages) =>
            messages.map((message) =>
              message.id === assistantMessageId
                ? { ...message, content: `${message.content}${chunk}` }
                : message
            )
          );
        },
        onDone: (response) => {
          this._messages.update((messages) =>
            messages.map((message) =>
              message.id === assistantMessageId
                ? {
                    ...message,
                    content: response.answer,
                    response,
                    isStreaming: false,
                    timestamp: new Date().toLocaleTimeString()
                  }
                : message
            )
          );

          if (response.filesUsed.length === 1) {
            const first = response.filesUsed[0];
            this.openCitation(first.path, first.chunk, response);
          }

          this._sending.set(false);
          this.stopStream = null;
          this._activeAssistantMessageId.set(null);
          this.loadConversations(this._activeConversationId());
        },
        onError: (message) => {
          this._messages.update((messages) =>
            messages.map((item) =>
              item.id === assistantMessageId
                ? { ...item, isStreaming: false }
                : item
            )
          );
          this._error.set(message || 'Failed to get Copilot response.');
          this._sending.set(false);
          this.stopStream = null;
          this._activeAssistantMessageId.set(null);
        }
      }
    );
  }

  cancelStream(): void {
    if (!this._sending()) {
      return;
    }

    this.stopStream?.();
    this.stopStream = null;
    const assistantId = this._activeAssistantMessageId();

    if (assistantId != null) {
      this._messages.update((messages) =>
        messages.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                isStreaming: false,
                content: `${message.content}\n\n[stream canceled]`
              }
            : message
        )
      );
    }

    this._activeAssistantMessageId.set(null);
    this._sending.set(false);
  }

  createNewConversation(): void {
    this.cancelStream();
    const nextId = this.nextConversationId();
    this._activeConversationId.set(nextId);
    this._messages.set([]);
    this._error.set(null);
    this.question = '';
    this.loadConversations(nextId);
  }

  onConversationChange(conversationId: string): void {
    if (!conversationId || conversationId === this._activeConversationId()) {
      return;
    }

    this.cancelStream();
    this._activeConversationId.set(conversationId);
    this.loadConversationHistory(conversationId);
  }

  openCitation(filePath: string, chunk: string, response?: KnowledgeChatResponse): void {
    this._selectedFilePath.set(filePath);
    this._selectedFileChunk.set(chunk);
    this._loadingFile.set(true);

    const snippet = response?.relevantCode?.find((code) => code.path === filePath);
    if (snippet) {
      this._selectedFileContent.set(snippet.code);
    } else {
      this._selectedFileContent.set('');
    }

    this.api.fetchProjectCode({ filePath }).subscribe({
      next: (payload) => {
        this._selectedFileContent.set(payload.content);
        this._loadingFile.set(false);
      },
      error: (error) => {
        const fallback = this._selectedFileContent();
        this._selectedFileContent.set(fallback || `Unable to load file: ${error?.message ?? 'Unknown error'}`);
        this._loadingFile.set(false);
      }
    });
  }

  refreshStatus(): void {
    this.api.getProjectStatus().subscribe({
      next: (status) => {
        this._status.set(status);
        this._activeZipName.set(status.activeZipName);
        this._selectedZipName.set(status.activeZipName);
        this._zipOptions.set(status.availableZips ?? []);
      },
      error: (error) => this._error.set(error?.message ?? 'Failed to fetch project status.')
    });
  }

  reindex(): void {
    if (this._reindexing()) {
      return;
    }

    this._reindexing.set(true);
    this._error.set(null);

    this.api.reindexProjectKnowledge().subscribe({
      next: (status) => {
        this._status.set(status);
        this._activeZipName.set(status.activeZipName);
        this._selectedZipName.set(status.activeZipName);
        this._zipOptions.set(status.availableZips ?? []);
        this._reindexing.set(false);
      },
      error: (error) => {
        this._error.set(error?.message ?? 'Failed to reindex project knowledge.');
        this._reindexing.set(false);
      }
    });
  }

  onZipChoiceChange(zipName: string): void {
    this._selectedZipName.set(zipName);
  }

  applyZipSelection(): void {
    const zipFileName = this._selectedZipName();
    if (!zipFileName || zipFileName === this._activeZipName() || this._switchingZip()) {
      return;
    }

    this.cancelStream();
    this._switchingZip.set(true);
    this._error.set(null);

    this.api.selectProjectZip(zipFileName).subscribe({
      next: (status) => {
        this._status.set(status);
        this._activeZipName.set(status.activeZipName);
        this._selectedZipName.set(status.activeZipName);
        this._zipOptions.set(status.availableZips ?? []);
        this._messages.set([]);
        this._switchingZip.set(false);
      },
      error: (error) => {
        this._error.set(error?.message ?? 'Failed to switch source zip.');
        this._switchingZip.set(false);
      }
    });
  }

  private loadZipOptions(): void {
    this.api.getProjectZips().subscribe({
      next: (options) => {
        this._zipOptions.set(options);
        const active = options.find((item) => item.isActive)?.name ?? null;
        if (active) {
          this._activeZipName.set(active);
          this._selectedZipName.set(active);
        }
      },
      error: () => {
        // Status API still carries zip metadata, so UI remains functional if this call fails.
      }
    });
  }

  private loadConversations(preferredConversationId?: string): void {
    this._loadingConversations.set(true);

    this.api.getKnowledgeConversations().subscribe({
      next: (list) => {
        const hasPreferred = !!preferredConversationId && list.some((item) => item.conversationId === preferredConversationId);
        const normalized = hasPreferred || !preferredConversationId
          ? list
          : [{
              conversationId: preferredConversationId,
              turnCount: 0,
              lastMessageAt: new Date().toISOString(),
              preview: 'New session'
            }, ...list];

        this._conversations.set(normalized);

        const selectedId = hasPreferred
          ? preferredConversationId
          : normalized[0]?.conversationId ?? preferredConversationId;

        if (selectedId && selectedId !== this._activeConversationId()) {
          this._activeConversationId.set(selectedId);
        }
        this._loadingConversations.set(false);
      },
      error: () => {
        this._loadingConversations.set(false);
      }
    });
  }

  private loadConversationHistory(conversationId: string): void {
    this.api.getKnowledgeConversationHistory(conversationId).subscribe({
      next: (history) => {
        this._messages.set(this.toChatMessages(history));
      },
      error: (error) => {
        this._error.set(error?.message ?? 'Failed to load conversation history.');
      }
    });
  }

  private toChatMessages(history: KnowledgeConversationHistory): ChatMessage[] {
    const items: ChatMessage[] = [];

    for (const turn of history.turns) {
      const userId = ++this.messageIdCounter;
      const assistantId = ++this.messageIdCounter;
      const time = new Date(turn.timestamp).toLocaleTimeString();
      items.push({ id: userId, role: 'user', content: turn.question, timestamp: time });
      items.push({ id: assistantId, role: 'assistant', content: turn.answer, timestamp: time });
    }

    return items;
  }

  private nextConversationId(): string {
    return `c3-${Date.now()}`;
  }

  private detectCodeLanguage(filePath: string | null): string {
    if (!filePath) {
      return 'txt';
    }

    const extension = filePath.split('.').pop()?.toLowerCase() ?? 'txt';
    if (['ts', 'tsx', 'js', 'jsx', 'json'].includes(extension)) {
      return extension;
    }
    if (['html', 'htm'].includes(extension)) {
      return 'html';
    }
    if (['scss', 'css'].includes(extension)) {
      return 'css';
    }
    return extension;
  }

  private renderHighlightedCode(content: string, language: string): SafeHtml {
    const escaped = this.escapeHtml(content || '');
    const highlighted = this.highlightByLanguage(escaped, language);
    const withLineNumbers = highlighted
      .split('\n')
      .map((line, index) =>
        `<span class="code-line"><span class="code-lineno">${index + 1}</span><span class="code-text">${line || ' '}</span></span>`
      )
      .join('');

    return this.sanitizer.bypassSecurityTrustHtml(withLineNumbers);
  }

  private highlightByLanguage(escapedCode: string, language: string): string {
    if (language === 'html') {
      return escapedCode
        .replace(/(&lt;\/?)([a-zA-Z0-9\-]+)/g, `$1<span class="code-token-tag">$2</span>`)
        .replace(/\s([a-zA-Z\-:]+)=/g, ` <span class="code-token-attr">$1</span>=`)
        .replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g, `<span class="code-token-string">$1</span>`);
    }

    if (language === 'css' || language === 'scss') {
      return escapedCode
        .replace(/(\/\*[\s\S]*?\*\/)/g, `<span class="code-token-comment">$1</span>`)
        .replace(/([#.a-zA-Z0-9_\-\s]+)(\s*\{)/g, `<span class="code-token-tag">$1</span>$2`)
        .replace(/([a-zA-Z\-]+)(\s*:)/g, `<span class="code-token-attr">$1</span>$2`)
        .replace(/(#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|rem|em|%)?\b)/g, `<span class="code-token-number">$1</span>`);
    }

    return escapedCode
      .replace(/(\/\*[\s\S]*?\*\/|\/\/.*$)/gm, `<span class="code-token-comment">$1</span>`)
      .replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;|`[^`]*`)/g, `<span class="code-token-string">$1</span>`)
      .replace(/\b(abstract|any|as|async|await|boolean|break|case|catch|class|const|continue|default|delete|do|else|enum|export|extends|false|finally|for|from|function|if|implements|import|in|interface|let|new|null|number|private|protected|public|readonly|return|static|string|switch|this|throw|true|try|type|typeof|undefined|var|void|while)\b/g, `<span class="code-token-keyword">$1</span>`)
      .replace(/\b(\d+(?:\.\d+)?)\b/g, `<span class="code-token-number">$1</span>`);
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
