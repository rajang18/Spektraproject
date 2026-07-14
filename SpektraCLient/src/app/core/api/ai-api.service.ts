import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from './api-endpoints';
import { ApiError } from './api-error.model';
import { ApiResponse } from './api-response.model';
import {
  JiraTaskRequest,
  JiraTaskResponse,
  KnowledgeChatRequest,
  KnowledgeChatResponse,
  KnowledgeConversationHistory,
  KnowledgeConversationSummary,
  KnowledgeCodeRequest,
  KnowledgeCodeResponse,
  KnowledgeExplainRequest,
  KnowledgeSearchRequest,
  KnowledgeSearchResponse,
  KnowledgeStatusResponse,
  KnowledgeZipOption,
  LogAnalysisRequest,
  LogAnalysisResponse,
  RequirementArtifactsRequest,
  RequirementArtifactsResponse,
  TestCaseGenerationRequest,
  TestCaseGenerationResponse
} from './ai-api.models';

@Injectable({ providedIn: 'root' })
export class AiApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly _isLoading = signal(false);
  private readonly _lastError = signal<ApiError | null>(null);

  readonly isLoading = computed(() => this._isLoading());
  readonly lastError = computed(() => this._lastError());

  generateRequirementArtifacts(
    request: RequirementArtifactsRequest
  ): Observable<RequirementArtifactsResponse> {
    return this.post<RequirementArtifactsRequest, RequirementArtifactsResponse>(
      API_ENDPOINTS.requirementToCode.generate,
      request
    );
  }

  analyzeLogs(request: LogAnalysisRequest): Observable<LogAnalysisResponse> {
    return this.post<LogAnalysisRequest, LogAnalysisResponse>(
      API_ENDPOINTS.logAnalyzer.analyze,
      request
    );
  }

  generateTestCases(
    request: TestCaseGenerationRequest
  ): Observable<TestCaseGenerationResponse> {
    return this.post<TestCaseGenerationRequest, TestCaseGenerationResponse>(
      API_ENDPOINTS.testCaseGenerator.generate,
      request
    );
  }

  generateJiraTasks(request: JiraTaskRequest): Observable<JiraTaskResponse> {
    return this.post<JiraTaskRequest, JiraTaskResponse>(
      API_ENDPOINTS.jiraGenerator.generate,
      request
    );
  }

  chatWithKnowledge(request: KnowledgeChatRequest): Observable<KnowledgeChatResponse> {
    return this.post<KnowledgeChatRequest, KnowledgeChatResponse>(
      API_ENDPOINTS.knowledge.chat,
      request
    );
  }

  searchProjectKnowledge(request: KnowledgeSearchRequest): Observable<KnowledgeSearchResponse> {
    return this.post<KnowledgeSearchRequest, KnowledgeSearchResponse>(
      API_ENDPOINTS.knowledge.search,
      request
    );
  }

  explainProjectContext(request: KnowledgeExplainRequest): Observable<KnowledgeChatResponse> {
    return this.post<KnowledgeExplainRequest, KnowledgeChatResponse>(
      API_ENDPOINTS.knowledge.explain,
      request
    );
  }

  fetchProjectCode(request: KnowledgeCodeRequest): Observable<KnowledgeCodeResponse> {
    return this.post<KnowledgeCodeRequest, KnowledgeCodeResponse>(
      API_ENDPOINTS.knowledge.code,
      request
    );
  }

  getProjectStatus(): Observable<KnowledgeStatusResponse> {
    const request$ = this.http.get<ApiResponse<KnowledgeStatusResponse>>(
      `${this.baseUrl}${API_ENDPOINTS.knowledge.status}`
    );

    return this.handleRequest(request$).pipe(map((response) => response.data));
  }

  reindexProjectKnowledge(): Observable<KnowledgeStatusResponse> {
    return this.post<Record<string, never>, KnowledgeStatusResponse>(
      API_ENDPOINTS.knowledge.reindex,
      {}
    );
  }

  getProjectZips(): Observable<KnowledgeZipOption[]> {
    const request$ = this.http.get<ApiResponse<KnowledgeZipOption[]>>(
      `${this.baseUrl}${API_ENDPOINTS.knowledge.zips}`
    );

    return this.handleRequest(request$).pipe(map((response) => response.data));
  }

  selectProjectZip(zipFileName: string): Observable<KnowledgeStatusResponse> {
    return this.post<{ zipFileName: string }, KnowledgeStatusResponse>(
      API_ENDPOINTS.knowledge.selectZip,
      { zipFileName }
    );
  }

  getKnowledgeConversations(limit = 50): Observable<KnowledgeConversationSummary[]> {
    const request$ = this.http.get<ApiResponse<KnowledgeConversationSummary[]>>(
      `${this.baseUrl}${API_ENDPOINTS.knowledge.conversations}?limit=${limit}`
    );

    return this.handleRequest(request$).pipe(map((response) => response.data));
  }

  getKnowledgeConversationHistory(conversationId: string): Observable<KnowledgeConversationHistory> {
    const encoded = encodeURIComponent(conversationId);
    const request$ = this.http.get<ApiResponse<KnowledgeConversationHistory>>(
      `${this.baseUrl}${API_ENDPOINTS.knowledge.conversations}/${encoded}`
    );

    return this.handleRequest(request$).pipe(map((response) => response.data));
  }

  streamKnowledgeChat(
    request: KnowledgeChatRequest,
    handlers: {
      onMeta?: (payload: unknown) => void;
      onDelta?: (payload: { chunk: string }) => void;
      onDone: (payload: KnowledgeChatResponse) => void;
      onError: (message: string) => void;
    }
  ): () => void {
    const params = new URLSearchParams({
      question: request.question,
      conversationId: request.conversationId ?? 'default-conversation'
    });

    const streamUrl = `${this.baseUrl}${API_ENDPOINTS.knowledge.chatStream}?${params.toString()}`;
    const source = new EventSource(streamUrl);

    source.addEventListener('meta', (event) => {
      if (!handlers.onMeta) {
        return;
      }

      try {
        handlers.onMeta(JSON.parse((event as MessageEvent<string>).data));
      } catch {
        handlers.onMeta((event as MessageEvent<string>).data);
      }
    });

    source.addEventListener('delta', (event) => {
      try {
        handlers.onDelta?.(JSON.parse((event as MessageEvent<string>).data) as { chunk: string });
      } catch {
        // Ignore malformed delta payload and keep stream alive.
      }
    });

    source.addEventListener('done', (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent<string>).data) as KnowledgeChatResponse;
        handlers.onDone(payload);
      } catch {
        handlers.onError('Failed to parse streamed response payload.');
      } finally {
        source.close();
      }
    });

    source.addEventListener('error', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent<string>).data) as { message?: string };
        handlers.onError(data.message ?? 'Streaming connection failed.');
      } catch {
        handlers.onError('Streaming connection failed.');
      } finally {
        source.close();
      }
    });

    return () => source.close();
  }

  private post<TRequest, TResponse>(
    endpoint: string,
    body: TRequest
  ): Observable<TResponse> {
    const request$ = this.http.post<ApiResponse<TResponse>>(
      `${this.baseUrl}${endpoint}`,
      body
    );

    return this.handleRequest(request$).pipe(
      map((response) => response.data)
    );
  }

  private handleRequest<T>(request$: Observable<T>): Observable<T> {
    this._isLoading.set(true);
    this._lastError.set(null);

    return request$.pipe(
      finalize(() => this._isLoading.set(false)),
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const apiError: ApiError = {
      code: error.status.toString(),
      message:
        error.error?.message ??
        error.message ??
        'Unable to complete the request. Please try again.',
      correlationId: error.error?.correlationId,
      details: error.error?.details ?? {
        url: error.url,
        statusText: error.statusText
      }
    };

    this._lastError.set(apiError);
    return throwError(() => apiError);
  }
}
