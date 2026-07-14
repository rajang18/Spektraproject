# API Patterns

## Core Files
- src/app/core/api/base-api.service.ts
- src/app/core/api/ai-api.service.ts
- src/app/core/api/api-endpoints.ts
- src/app/core/api/api-response.model.ts
- src/environments/environment*.ts

## Endpoint Strategy
Use API_ENDPOINTS constants. Current AI endpoints:
- /requirement-to-code/generate
- /log-analyzer/analyze
- /jira-task-generator/generate
- /test-case-generator/generate

## Request Flow
Component -> Service -> HttpClient -> Interceptors -> Backend

## Interceptor Chain
Configured order:
1. correlationIdInterceptor
2. authInterceptor
3. loadingInterceptor
4. errorInterceptor

## Auth Header
authInterceptor injects bearer token if available.

## Error Handling
errorInterceptor shows user-facing notification.
AiApiService also maps HttpErrorResponse into typed ApiError and stores lastError signal.

## Environment Config
Base URL from environment.apiBaseUrl.
Default dev value currently points to http://localhost:5000/api/v1.

## New API Integration Checklist
1. Add endpoint constant.
2. Add request/response model.
3. Add service method.
4. Map DTO to page view model.
5. Verify loading and error UX.
