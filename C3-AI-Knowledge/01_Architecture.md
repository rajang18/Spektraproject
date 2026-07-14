# Architecture

## High-Level Style
- Standalone component architecture.
- Lazy-loaded feature routes.
- Core layer for cross-cutting concerns.
- Shared layer for reusable, business-neutral UI.
- Feature-first organization for domain workflows.

## Runtime Layers
1. UI Components (pages, shared components)
2. Feature orchestration (signals, view state, route params)
3. API services (AiApiService, BaseApiService)
4. HTTP interceptors
5. Backend APIs

## Core Cross-Cutting Systems
- Auth: AuthService, AuthStoreService, TokenStorageService, authGuard
- Theme: ThemeService and CSS variable tokens
- Loading: loadingInterceptor + LoadingService
- Error handling: errorInterceptor + NotificationService
- Tracing: correlationIdInterceptor

## Main Route Topology
- /login (public)
- /dashboard
- /requirement-to-code
- /log-analyzer
- /jira-generator
- /test-case-generator
- /history
- /settings

## Frontend to Backend Contract
- Base URL from environment.apiBaseUrl
- API endpoints centralized in core/api/api-endpoints.ts
- Standard response wrapper: ApiResponse<T>

## Architecture Decisions
- Use Signals for local feature UI state and derived state.
- Use RxJS for async orchestration and HTTP streams.
- Keep feature page self-contained unless logic is truly shared.
- Keep shell and theme concerns centralized.

## Architecture Change Rules
- New business workflow: create a new feature folder and lazy route.
- New global concern: add in core layer.
- New reusable visual primitive: add in shared/components.
- Avoid placing business-specific logic in shared.
