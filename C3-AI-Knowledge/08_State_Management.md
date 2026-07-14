# State Management

## Current Approach
- Signals for local and derived UI state.
- Computed for selectors and derived values.
- RxJS for API orchestration and stream composition.

## Auth State
AuthStoreService holds user signal and derived values:
- user
- isAuthenticated
- roles
- firstName

Persistence:
- user stored in localStorage key spektra.user
- token stored in localStorage key spektra.accessToken

## Feature State Examples
- Requirement page: artifacts, loading flag, error, selected view/file from query params.
- Log analyzer page: input tab, drag state, analysis result, copy state.
- Shell: mobile nav state, user-menu state, responsive breakpoints.

## Global Utility State
- LoadingService tracks active request count and exposes isLoading.
- ThemeService tracks light/dark mode and syncs to document root.

## Rules For New Feature State
- Keep workflow state inside feature page/store.
- Keep global-only state in core services.
- Avoid putting temporary view state into localStorage unless needed.
- Derive UI from signals instead of imperative DOM logic.
