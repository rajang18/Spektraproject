# Common Utilities

## Core Utility Services
- ThemeService: theme mode state and persistence.
- LoadingService: active HTTP request counter.
- NotificationService: toast/snackbar notifications.
- LoggerService and TelemetryService: diagnostics and telemetry hooks.

## API Utilities
- BaseApiService for basic HTTP verbs.
- http-params.util for query param helpers.
- API_ENDPOINTS constant map for route consistency.

## Auth Utilities
- TokenStorageService
- AuthStoreService
- authGuard

## Shared UI Utilities
- ConfirmationDialogComponent
- PageHeaderComponent
- DataTableComponent
- EmptyStateComponent
- StatusChipComponent

## Utility Usage Rule
Before adding a new helper:
1. Check core/services and shared/components first.
2. If utility is business-specific, keep it in feature scope.
3. If utility is app-wide and reusable, place in core/shared accordingly.
