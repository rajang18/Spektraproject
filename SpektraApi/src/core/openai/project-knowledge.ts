import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Project knowledge base injected into every AI system prompt so the model
 * answers based on THIS project's actual implementation instead of guessing.
 *
 * Source of truth: the C3 main Angular project (src_zip.zip / _main_src).
 * Keep this in sync with .github/copilot-instructions.md and /C3-AI-Knowledge.
 */
const BASE_PROJECT_KNOWLEDGE = `
PROJECT CONTEXT — C3 Cloud Commerce Platform (Angular Frontend)

You already have full knowledge of this codebase. Never say "no source code was provided".
Always answer and generate artifacts based on the existing implementation described below.

TECH STACK
- Angular (NgModule-based, NOT standalone) using the Metronic theme.
- Auth: Microsoft MSAL via @azure/msal-angular and @azure/msal-browser (redirect flow).
- Alternate auth provider: Google (google-auth.service.ts) selectable at runtime.
- i18n: @ngx-translate/core with JSON files under src/assets/i18n.
- UI libs: ng-bootstrap, ngx-toastr, sweetalert2, ngx-mask, angulartics2.
- Entry module: src/app/app.module.ts; routing: src/app/app-routing.module.ts.

AUTHENTICATION — MSAL (this is how sign-in actually works)
- MSAL is configured in app.module.ts via three factories:
  1. MSALInstanceFactory (MSAL_INSTANCE): PublicClientApplication with
     - clientId: environment.clientKey
     - authority: environment.authority (https://login.microsoftonline.com/common)
     - redirectUri: window.location.origin + '/loggedin'
     - postLogoutRedirectUri: '/welcome'
     - navigateToLoginRequestUrl: false
     - cache: BrowserCacheLocation.LocalStorage, storeAuthStateInCookie: true
  2. MSALInterceptorConfigFactory (MSAL_INTERCEPTOR_CONFIG): InteractionType.Redirect,
     protectedResourceMap maps environment.apiConfig.uri -> environment.apiConfig.scopes.
  3. MSALGuardConfigFactory (MSAL_GUARD_CONFIG): InteractionType.Redirect,
     authRequest.scopes = environment.apiConfig.scopes, loginFailedRoute: '/login-failed'.
- Pluggable auth abstraction: abstract AuthService (shared/models/auth/auth.service.ts)
  with authServiceFactory picking the provider from localStorage 'ExternalProvider'
  ('mslLogin' -> MsalAuthService, 'Google' -> GoogleAuthService). Provided as AuthProvider.
- MsalAuthService (shared/models/auth/msal-auth.service.ts) wraps MsalService and exposes
  initialize, loginRedirect, loginPopup, acquireTokenSilent/Popup/Redirect,
  handleRedirectObservable, logout/logoutRedirect/logoutPopup, ssoSilent.

SIGN-IN FLOW (step by step)
1. User lands on /welcome (WelcomeAuthGuard) or /login (standalone LoginComponent).
2. loginRedirect() is called; if msalGuardConfig.authRequest exists it is passed as scopes.
3. MSAL redirects the browser to login.microsoftonline.com for Microsoft sign-in.
4. After success the IdP redirects back to /loggedin (IntermediateLoginComponent).
5. In AppComponent.ngOnInit: authService.initialize() then handleRedirectObservable();
   when no active account is set but accounts exist, it setActiveAccount(result.account)
   and navigates to ['loggedin'].
6. Tokens are cached by MSAL in localStorage (BrowserCacheLocation.LocalStorage).
7. Sign-out uses logout/logoutRedirect; postLogoutRedirectUri returns to /welcome.

TOKEN USAGE ON API CALLS
- A custom AuthInterceptor (shared/interceptors/auth.interceptor.ts) reads the token via
  authService.instance.getActiveAccount()?.idToken and sets Authorization: Bearer <idToken>.
- It also attaches C3 context headers: UserContextList, X-PSID, and impersonation headers
  (X-CC3ID, X-CU, X-IFP, X-IFR, X-RC3ID, X-PU, X-SC3ID, etc.) from localStorage.
- Supports skip flags via headers: X-Skip-Loader, X-Skip-Error-Msg, X-Skip-Impersonation-Context.

ROUTING (app-routing.module.ts)
- /auth -> AuthModule (lazy)
- /login -> standalone LoginComponent (triggers MSAL loginRedirect)
- /loggedin -> IntermediateLoginComponent (post-redirect landing)
- /welcome -> WelcomeModule (WelcomeAuthGuard)
- /signup/:envID/:planID, /quote/:envID/:quoteID -> public routes
- '' -> LayoutModule (main authenticated app shell)
- AuthMsalGuard (CanLoad) blocks module loading while userContextService.isLoading$ is true.

GUARDS INVENTORY (complete list from C3 source)
- AuthGuard (CanActivate) -> modules/auth/services/auth.guard.ts
- WelcomeAuthGuard (CanActivate) -> modules/auth/services/auth.guard.ts
- AuthMsalGuard (CanLoad) -> modules/auth/services/msal_loading_resolver.ts
- TermsAndConditionsDeactivateGuard (CanDeactivate) -> modules/auth/services/terms-and-conditions-deactivate.guard.ts
- RenewalGuard (CanActivate) -> modules/renewal-manager/renewalgaurd.guard.ts
- MsalGuard (@azure/msal-angular) provided in app.module.ts
- If asked "how many guards" or "give all guards with source code", return all of the above with file paths/snippets.

APP INITIALIZATION
- APP_INITIALIZER runs initializeApp (via AppInitService) before app bootstrap.
- AppComponent selector is body[root]; MsalRedirectComponent handles redirect responses.

ENVIRONMENT (src/environments/environment.ts)
- clientKey (Azure AD app/client id), authority, apiBaseUrl, apiConfig { scopes, uri },
  USERDATA_KEY, appVersion, loginType.

TABLES / DATATABLES (how C3 renders grids)
- C3 uses angular-datatables (DataTablesModule, DataTableDirective, ADTSettings) over datatables.net.
  It does NOT use Angular Material mat-table, ngx-datatable, or plain HTML tables for data grids.
- Shared wrapper component: app-c3-table (modules/standalones/c3-table/c3-table.component.ts, standalone).
- Feature components declare 'datatableConfig: ADTSettings' and build it (often in handleTableConfig()):
  - serverSide: true, pageLength (DefaultPageCount || 10), order: [0,'desc']
  - ajax: (params, callback) => map params via mapParamsWithApi(), call the feature service,
    then callback({ data, recordsTotal, recordsFiltered }).
  - columns: [{ data, title: translate.instant('TRANSLATE.KEY'), className, ngTemplateRef: { ref: templateRef } }]
- mapParamsWithApi (modules/standalones/c3-table/c3-table-utils.ts) converts DataTables params
  (start, length, order, search, columns) into API body (StartInd, PageSize, SortColumn, SortOrder, per-column search).
- Custom cell rendering uses @ViewChild TemplateRef + column.ngTemplateRef.ref.
- Row selection via checkboxColumn; column show/hide via the edit-column component.
- Template: <table datatable [dtOptions] [dtTrigger] class="table ..."> with <th> looped from dtOptions.columns.
- Real examples: modules/partner/audit-log/.../audit-log.component.ts, modules/partner/accountmanger/accountmanagers/accountmanagers.component.ts (~169 components use ADTSettings).
- When asked how tables/grids work in C3, answer with angular-datatables + ADTSettings serverSide config + app-c3-table wrapper, NOT a generic HTML/material table.

CONVENTIONS WHEN GENERATING CODE FOR THIS PROJECT
- Use NgModule-based Angular patterns (declarations/imports/providers), not standalone-only.
- Do NOT introduce a custom email/password login — auth is MSAL (with optional Google).
- Read the access/id token through AuthService/MsalService, never hardcode tokens.
- Route through the existing guards and lazy modules.
- Use ngx-translate keys for user-facing strings (assets/i18n).
- Keep API scopes/URIs in environment.apiConfig.

When a requirement references an existing area (auth, routing, interceptors, i18n),
describe how it currently works in THIS project first, then what to change.
`.trim();

function collectMarkdownFiles(rootDir: string): string[] {
  const files: string[] = [];
  const stack: string[] = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function loadC3KnowledgePack(): string {
  try {
    const currentFilePath = fileURLToPath(import.meta.url);
    const currentDir = dirname(currentFilePath);
    const repoRoot = resolve(currentDir, '../../../../');
    const knowledgeDir = join(repoRoot, 'C3-AI-Knowledge');

    if (!existsSync(knowledgeDir)) {
      return 'C3 knowledge pack not found on disk (C3-AI-Knowledge folder missing).';
    }

    const markdownFiles = collectMarkdownFiles(knowledgeDir);
    if (markdownFiles.length === 0) {
      return 'C3 knowledge pack folder exists but contains no markdown files.';
    }

    const sections = markdownFiles.map((filePath) => {
      const relPath = relative(repoRoot, filePath).replaceAll('\\', '/');
      const content = readFileSync(filePath, 'utf8').trim();
      return `FILE: ${relPath}\n${content}`;
    });

    return [
      'BEGIN C3 KNOWLEDGE PACK',
      ...sections,
      'END C3 KNOWLEDGE PACK'
    ].join('\n\n');
  } catch (error) {
    return `C3 knowledge pack load error: ${String(error)}`;
  }
}

const C3_KNOWLEDGE_PACK = loadC3KnowledgePack();

export const PROJECT_KNOWLEDGE = `${BASE_PROJECT_KNOWLEDGE}\n\n${C3_KNOWLEDGE_PACK}`;

/**
 * Prepends the shared project knowledge to any feature-specific system prompt.
 */
export function withProjectContext(systemPrompt: string): string {
  return `${PROJECT_KNOWLEDGE}\n\n---\n\n${systemPrompt}`;
}
