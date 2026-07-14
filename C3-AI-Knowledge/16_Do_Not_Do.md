# Do Not Do

- Do not bypass BaseApiService/AiApiService with direct HttpClient calls in pages.
- Do not hardcode light-only text or background colors in form controls.
- Do not put feature-specific business logic inside shared components.
- Do not add global state for temporary page-only UI data.
- Do not disable auth guard for protected routes.
- Do not duplicate endpoint strings in multiple files.
- Do not break interceptor order without clear reason.
- Do not ship feature pages without loading and error handling.
- Do not add large unrelated refactors while implementing a new requirement.
- Do not change route paths casually because shell navigation depends on them.
