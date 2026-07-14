# Routing Guide

## Root Routing
Defined in src/app/app.routes.ts.

Public route:
- /login

Protected shell routes (guarded by authGuard):
- /dashboard
- /requirement-to-code
- /log-analyzer
- /jira-generator
- /test-case-generator
- /history
- /settings

Default redirects:
- root redirects to /dashboard
- wildcard redirects to /dashboard

## Feature Route Pattern
Each feature exposes a routes file with path '' and a page component.
Examples:
- dashboard.routes.ts
- requirement-to-code.routes.ts
- log-analyzer.routes.ts

## Guard Behavior
authGuard allows access only when token exists in TokenStorageService.
If token missing, redirect to /login.

## Adding a New Feature Route
1. Create feature folder under src/app/features/<feature-name>.
2. Add <feature-name>.routes.ts with path ''.
3. Add lazy load entry in app.routes.ts under shell children.
4. Add navigation item in ShellComponent if user-visible.
