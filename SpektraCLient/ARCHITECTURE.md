# Spektra AI Copilot Angular Architecture

This client is structured as an Angular 18 standalone application for an enterprise AI Engineering Copilot platform. The architecture favors lazy-loaded feature ownership, a small singleton core, reusable shared UI, typed API boundaries, and Signals for local and feature state.

## Recommended Folder Structure

```txt
src/
  app/
    app.component.ts
    app.config.ts
    app.routes.ts
    core/
      api/
      auth/
      interceptors/
      layout/
      models/
      services/
    shared/
      components/
      directives/
      models/
      pipes/
      utils/
    features/
      dashboard/
      requirement-to-code/
      log-analyzer/
      jira-generator/
      test-case-generator/
  environments/
```

## Routing Structure

The root router uses `ShellComponent` for authenticated application pages and lazy-loads each business feature:

- `/dashboard`
- `/requirement-to-code`
- `/log-analyzer`
- `/jira-generator`
- `/test-case-generator`
- `/auth/login`

Each feature owns its route file, page components, services, models, and Signal store. This keeps routing changes local to the feature and avoids a central routes file becoming a bottleneck.

## Shared Module Strategy

This project intentionally does not use a traditional `SharedModule`. Angular 18 standalone components should import exactly what they need:

- Shared components are standalone and imported directly.
- Angular Material modules are imported at the component boundary.
- Reusable grouped imports may be introduced only when they remove repetition without hiding too much dependency context.
- Business-specific components stay inside their feature folder, not in `shared`.

## State Management Strategy

Use Signals for synchronous UI state and derived state:

- Form draft state
- Loading flags
- Selected items
- Generated AI results
- Derived view state with `computed`

Use RxJS for asynchronous workflows:

- HTTP requests
- Cancellation
- Retries
- Polling
- WebSocket or streaming responses
- Complex orchestration

Recommended state boundaries:

- Component state: transient presentation state
- Feature store: state for one lazy feature
- Root store: authenticated user, tenant context, theme, notifications

Feature stores should usually be provided at the page or feature route level so state resets naturally when the user leaves the workflow.

## Services Architecture

The service flow is:

```txt
Component -> Feature Store -> Feature Service -> BaseApiService -> HttpClient -> Interceptors
```

Guidelines:

- Components do not call `HttpClient` directly.
- Feature services expose use-case methods such as `generateCode`, `analyze`, and `generateStory`.
- `BaseApiService` centralizes URL composition and common HTTP verbs.
- `API_ENDPOINTS` centralizes API path constants.
- Request and response DTOs are strongly typed in each feature.

## API Integration Layer

Core API files:

- `core/api/base-api.service.ts`
- `core/api/api-endpoints.ts`
- `core/api/api-response.model.ts`
- `core/api/api-error.model.ts`
- `core/api/http-params.util.ts`

Environment-specific API URLs live in:

- `environment.development.ts`
- `environment.qa.ts`
- `environment.production.ts`

## Interceptors

Configured in `app.config.ts`:

- `correlationIdInterceptor`: adds request correlation IDs for traceability
- `authInterceptor`: attaches bearer tokens
- `loadingInterceptor`: tracks global loading state
- `errorInterceptor`: centralizes user-facing API errors

## Best Practices

- Use standalone components by default.
- Lazy-load every major feature.
- Keep `core` singleton-only.
- Keep `shared` generic and business-neutral.
- Keep feature code self-contained.
- Prefer `ChangeDetectionStrategy.OnPush`.
- Use Signals for feature UI state.
- Use RxJS for async and stream behavior.
- Keep DTOs explicit and typed.
- Use functional guards and interceptors.
- Add empty, loading, success, and error states to every AI workflow.
- Add correlation IDs to long-running AI requests.
- Avoid importing all Angular Material modules globally.
- Use route-level providers for feature-scoped state.

## Suggested Angular Material Components

Dashboard:

- `MatCard`
- `MatGridList`
- `MatTable`
- `MatProgressBar`
- `MatIcon`
- `MatChips`

Requirement to Code:

- `MatFormField`
- `MatInput`
- `MatTabs`
- `MatButton`
- `MatProgressSpinner`
- `MatDialog`

Log Analyzer:

- `MatTable`
- `MatPaginator`
- `MatSort`
- `MatChips`
- `MatSelect`
- `MatExpansionPanel`

Jira Generator:

- `MatStepper`
- `MatFormField`
- `MatInput`
- `MatSelect`
- `MatCheckbox`
- `MatDialog`

Test Case Generator:

- `MatTable`
- `MatPaginator`
- `MatTabs`
- `MatButtonToggle`
- `MatMenu`
- `MatCheckbox`

Global Shell:

- `MatSidenav`
- `MatToolbar`
- `MatList`
- `MatIcon`
- `MatMenu`
- `MatTooltip`
