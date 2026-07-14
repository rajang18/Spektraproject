# Authentication (MSAL) — C3 Main Project

This is the ACTUAL authentication implementation in the main C3 Angular project.
Source files live under src/app (extracted reference: _main_src/src/app).

## Summary
- Authentication uses Microsoft MSAL: `@azure/msal-angular` + `@azure/msal-browser`.
- Interaction type is REDIRECT (not popup by default).
- A pluggable auth abstraction allows MSAL or Google as the provider.
- Tokens are cached by MSAL in localStorage.

## MSAL Configuration (src/app/app.module.ts)
Three factory providers configure MSAL:

1. `MSALInstanceFactory` → `MSAL_INSTANCE`
   - clientId: `environment.clientKey`
   - authority: `environment.authority` (https://login.microsoftonline.com/common)
   - redirectUri: `${window.location.origin}/loggedin`
   - postLogoutRedirectUri: `/welcome`
   - navigateToLoginRequestUrl: false
   - cache: `BrowserCacheLocation.LocalStorage`, `storeAuthStateInCookie: true`
   - system: `allowNativeBroker: false`

2. `MSALInterceptorConfigFactory` → `MSAL_INTERCEPTOR_CONFIG`
   - `InteractionType.Redirect`
   - protectedResourceMap: `environment.apiConfig.uri` → `environment.apiConfig.scopes`

3. `MSALGuardConfigFactory` → `MSAL_GUARD_CONFIG`
   - `InteractionType.Redirect`
   - authRequest.scopes: `environment.apiConfig.scopes`
   - loginFailedRoute: `/login-failed`

Providers also include: `AuthProvider`, `MsalService`, and `APP_INITIALIZER` (initializeApp).

## Pluggable Auth Provider (src/app/shared/models/auth/auth.service.ts)
- `AuthService` is an abstract class defining: initialize, acquireTokenPopup,
  acquireTokenRedirect, acquireTokenSilent, handleRedirectObservable, loginPopup,
  loginRedirect, logout, logoutRedirect, logoutPopup, ssoSilent, getLogger, setLogger.
- `authServiceFactory` chooses the provider from `localStorage.getItem('ExternalProvider')`:
  - `mslLogin` → `MsalAuthService`
  - `Google` → `GoogleAuthService`
- Registered as `AuthProvider` (FactoryProvider) so components inject `AuthService`.

## MSAL Wrapper (src/app/shared/models/auth/msal-auth.service.ts)
`MsalAuthService implements AuthService` and delegates to `MsalService`
(`this.instance = msalService.instance`).

## Sign-In Flow (step by step)
1. User lands on `/welcome` (WelcomeAuthGuard) or `/login` (standalone LoginComponent).
2. `loginRedirect()` is called; when `msalGuardConfig.authRequest` exists it is spread as scopes.
3. MSAL redirects the browser to login.microsoftonline.com.
4. On success the IdP redirects to `/loggedin` (IntermediateLoginComponent).
5. `AppComponent.ngOnInit` runs `authService.initialize()` then `handleRedirectObservable()`;
   if there is no active account but accounts exist, it `setActiveAccount(result.account)`
   and navigates to `['loggedin']`.
6. Tokens are cached in localStorage by MSAL.
7. Sign-out uses `logout` / `logoutRedirect`; postLogout returns to `/welcome`.

## Token Injection (src/app/shared/interceptors/auth.interceptor.ts)
- Custom `AuthInterceptor` reads `authService.instance.getActiveAccount()?.idToken`.
- Sets `Authorization: Bearer <idToken>`.
- Adds C3 context headers: `UserContextList`, `X-PSID`, and impersonation headers
  (`X-CC3ID`, `X-CU`, `X-IFP`, `X-IFR`, `X-RC3ID`, `X-PU`, `X-SC3ID`, `X-SDC3ID`, etc.).
- Honors skip flags: `X-Skip-Loader`, `X-Skip-Error-Msg`, `X-Skip-Impersonation-Context`.

## Guards & Routing (src/app/app-routing.module.ts)
- `/auth` → AuthModule (lazy)
- `/login` → standalone LoginComponent (triggers MSAL loginRedirect)
- `/loggedin` → IntermediateLoginComponent (post-redirect landing)
- `/welcome` → WelcomeModule (WelcomeAuthGuard)
- `''` → LayoutModule (authenticated shell)
- `AuthMsalGuard` (CanLoad) blocks module loading while `userContextService.isLoading$` is true.

## Environment Keys (src/environments/environment.ts)
- `clientKey`, `authority`, `apiBaseUrl`, `apiConfig { scopes, uri }`, `USERDATA_KEY`, `loginType`.

## How To Change / Extend Auth
- New protected API: add its URI + scopes to `environment.apiConfig` (and protectedResourceMap).
- New provider: implement `AuthService` and extend `authServiceFactory`.
- Switch to popup: change `InteractionType.Redirect` to `Popup` in the guard/interceptor factories.
- Never build a separate email/password login — this project is MSAL-first.
