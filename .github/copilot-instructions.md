# Copilot Instructions For This Repository

This file is the AI knowledge base. The MAIN project being documented is the
**C3 Cloud Commerce Platform** Angular frontend (source in src_zip.zip, extracted to _main_src/src).
Always answer based on the ACTUAL C3 code described below. Never say "no source code was provided".

> Note: This workspace also contains a separate demo app (SpektraCLient / SpektraApi).
> When the user asks about "my project", they mean the C3 main project unless they say otherwise.

---

## RESPONSE RULES FOR EVERY REQUEST
1. State what already exists in the C3 project related to the requirement.
2. State the gap — what is missing.
3. Provide a file-level change plan naming exact files to add or edit.
4. Check impact: auth (MSAL), routing/guards, i18n, interceptors, theme.
5. Keep changes minimal and compatible. Do not refactor unrelated code.

---

## C3 PROJECT OVERVIEW
- Angular **NgModule-based** app (not standalone) using the Metronic theme.
- Entry: `src/app/app.module.ts`; routing: `src/app/app-routing.module.ts`.
- Auth: Microsoft **MSAL** (`@azure/msal-angular`, `@azure/msal-browser`), redirect flow.
- Alternate provider: Google (`google-auth.service.ts`), selected at runtime.
- i18n: `@ngx-translate/core` with JSON under `src/assets/i18n`.
- UI libs: ng-bootstrap, ngx-toastr, sweetalert2, ngx-mask, angulartics2.
- Domain: CSP / cloud commerce (customers, tenants, subscriptions, resellers, impersonation).

---

## AUTHENTICATION — MSAL (how sign-in actually works)
Configured in `app.module.ts` via three factories:
- `MSALInstanceFactory` (MSAL_INSTANCE): clientId `environment.clientKey`, authority
  `environment.authority` (login.microsoftonline.com/common), redirectUri `${origin}/loggedin`,
  postLogoutRedirectUri `/welcome`, cache `BrowserCacheLocation.LocalStorage`, storeAuthStateInCookie true.
- `MSALInterceptorConfigFactory` (MSAL_INTERCEPTOR_CONFIG): InteractionType.Redirect,
  protectedResourceMap `environment.apiConfig.uri` → `environment.apiConfig.scopes`.
- `MSALGuardConfigFactory` (MSAL_GUARD_CONFIG): InteractionType.Redirect,
  authRequest.scopes `environment.apiConfig.scopes`, loginFailedRoute `/login-failed`.

Pluggable abstraction: abstract `AuthService` (`shared/models/auth/auth.service.ts`) with
`authServiceFactory` choosing provider via `localStorage 'ExternalProvider'`
(`mslLogin` → `MsalAuthService`, `Google` → `GoogleAuthService`), provided as `AuthProvider`.
`MsalAuthService` wraps `MsalService`.

Sign-in flow:
1. `/welcome` (WelcomeAuthGuard) or `/login` (LoginComponent) → `loginRedirect()`.
2. Browser redirects to Microsoft login.
3. Returns to `/loggedin` (IntermediateLoginComponent).
4. `AppComponent.ngOnInit` → `authService.initialize()` + `handleRedirectObservable()`
   sets active account and navigates to `['loggedin']`.
5. Tokens cached in localStorage; sign-out via `logout/logoutRedirect` → `/welcome`.

Token on API calls: custom `AuthInterceptor` (`shared/interceptors/auth.interceptor.ts`) uses
`authService.instance.getActiveAccount()?.idToken` → `Authorization: Bearer <idToken>` and adds
C3 context/impersonation headers (UserContextList, X-PSID, X-CC3ID, X-CU, X-IFP, X-IFR, X-RC3ID, X-PU, X-SC3ID…).

Full detail: see `C3-AI-Knowledge/17_Authentication_MSAL.md`.

---

## ROUTING (src/app/app-routing.module.ts)
- `/auth` → AuthModule (lazy)
- `/login` → standalone LoginComponent (MSAL loginRedirect)
- `/loggedin` → IntermediateLoginComponent (post-redirect landing)
- `/welcome` → WelcomeModule (WelcomeAuthGuard)
- `/signup/:envID/:planID`, `/quote/:envID/:quoteID` → public routes
- `''` → LayoutModule (authenticated shell)
- `AuthMsalGuard` (CanLoad) blocks module load while `userContextService.isLoading$` is true.

---

## APP INITIALIZATION
- `APP_INITIALIZER` runs `initializeApp` (AppInitService) before bootstrap.
- `AppComponent` selector is `body[root]`; `MsalRedirectComponent` handles redirect responses.

---

## ENVIRONMENT (src/environments/environment.ts)
- `clientKey` (Azure AD client id), `authority`, `apiBaseUrl`, `apiConfig { scopes, uri }`,
  `USERDATA_KEY`, `appVersion`, `loginType`.

---

## FOLDER STRUCTURE (src/app)
```
app.module.ts            (root NgModule, MSAL config)
app-routing.module.ts    (top-level routes + guards)
app.component.ts         (body[root], MSAL redirect handling)
_c3-lib/                 (init, layout, partials — Metronic base)
modules/                 (auth, welcome, public-signup, standalones, errors, feature modules)
services/                (user-context, permission, menu, session-timeout, etc.)
shared/                  (interceptors, models/auth, pipes, directives, utilities)
```

---

## CONVENTIONS WHEN GENERATING CODE
- Use NgModule patterns (declarations/imports/providers), not standalone-only.
- Auth is MSAL — do NOT invent an email/password login.
- Read tokens through `AuthService`/`MsalService`, never hardcode.
- Route via existing guards and lazy modules.
- Use ngx-translate keys for UI strings (assets/i18n), not hardcoded text.
- Keep API scopes/URIs in `environment.apiConfig`.

---

## DO NOT DO
- Do not describe this project as standalone Angular or as email/password auth.
- Do not bypass MSAL guards/interceptor.
- Do not hardcode secrets, tokens, client ids in components.
- Do not add unrelated refactors while implementing a requirement.
