# Project Overview — C3 Cloud Commerce Platform

## Purpose
This knowledge base documents the ACTUAL C3 Angular frontend so AI answers and new
feature plans stay aligned with real code. Source: src_zip.zip (extracted to _main_src/src).

## Project Scope
- App: C3 Cloud Commerce Platform (CSP / cloud commerce portal).
- Frontend framework: Angular **NgModule-based** (not standalone), Metronic theme.
- Entry: `src/app/app.module.ts`; routing: `src/app/app-routing.module.ts`.
- Auth: Microsoft **MSAL** redirect flow (with optional Google provider).
- i18n: `@ngx-translate/core` (JSON under `src/assets/i18n`).
- Domain concepts: customers, tenants, subscriptions, resellers, partners, impersonation.

## Key Areas Already Implemented
- MSAL authentication (Microsoft sign-in) with pluggable provider abstraction.
- Custom `AuthInterceptor` adding bearer token + C3 context/impersonation headers.
- Lazy-loaded feature modules (auth, welcome, public-signup, layout, etc.).
- Session timeout handling, permission service, menu service, user-context service.
- App initialization via `APP_INITIALIZER` (AppInitService).

## Canonical Sign-In Flow
1. `/welcome` or `/login` triggers `loginRedirect()`.
2. Browser redirects to login.microsoftonline.com.
3. Returns to `/loggedin` (IntermediateLoginComponent).
4. `AppComponent` runs `initialize()` + `handleRedirectObservable()`, sets active account.
5. Token cached in localStorage; API calls carry `Authorization: Bearer <idToken>`.

## How AI Should Use This Folder
For every new requirement:
1. Read this folder first (especially 17_Authentication_MSAL.md for auth).
2. Map the requirement to existing modules/routes.
3. Reuse existing patterns (NgModule, MSAL, interceptors, ngx-translate).
4. State what exists, what is missing, and the exact files to change.
5. Prefer minimal compatible changes; do not convert to standalone or invent new auth.

## Response Template For New Requirements
- Existing implementation: what already exists in C3.
- Gap analysis: what is missing.
- Change plan: exact modules/components/services/interceptors/routes to edit.
- Safety checks: auth (MSAL), routing/guards, i18n, interceptors, theme.
- Delivery: phased, low-risk first.

## Quick Sign-In Answer (reference)
Q: How does sign-in work in this project?
A: Via Microsoft MSAL redirect. `/login` or `/welcome` calls `loginRedirect()`; after
Microsoft login the app returns to `/loggedin`, `AppComponent` handles the redirect and sets
the active account, and the custom `AuthInterceptor` attaches the id token as a bearer header.
Provider is pluggable (MSAL default, Google optional) via `localStorage 'ExternalProvider'`.
