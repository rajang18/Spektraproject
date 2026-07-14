# File Folder Structure

## Frontend Root
SpektraCLient/src

## App Tree (Current)
- app/app.component.*
- app/app.config.ts
- app/app.routes.ts
- app/core/
  - api/
  - auth/
  - interceptors/
  - layout/
  - models/
  - services/
- app/features/
  - auth/
  - dashboard/
  - requirement-to-code/
  - log-analyzer/
  - jira-generator/
  - test-case-generator/
  - history/
  - settings/
- app/shared/
  - components/
  - models/

## Ownership Rules
- core: singleton app-wide services and infrastructure.
- features: business workflows and route pages.
- shared: reusable generic UI and helpers.

## New Feature Folder Template
- features/<feature-name>/<feature-name>.routes.ts
- features/<feature-name>/pages/<feature-page>/<feature-page>.component.ts
- optional services/models folders inside feature as complexity grows.
