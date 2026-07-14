# Component Patterns

## Component Types In This Project
- Feature pages: feature-owned, route entry components.
- Shell layout: global authenticated layout with navigation and user controls.
- Shared reusable components: generic UI (data table, confirmation dialog, page header, etc.).

## Recommended Page Structure
- Title section
- Tabs or mode switch (if workflow-based)
- Input section
- Loading section
- Result section
- Error display section

## Pattern Used In AI Screens
Requirement to Code and Log Analyzer follow a multi-view pattern:
- input
- loading/analyzing
- output views

Keep these as explicit string unions and computed view selectors.

## Inline Template vs External Template
- Large pages currently use inline templates in some features.
- Prefer external template/scss for very large pages when maintainability drops.
- Keep style ownership local to feature unless it is a global token or utility.

## Shared Components Already Available
- shared/components/data-table
- shared/components/confirmation-dialog
- shared/components/page-header
- shared/components/empty-state
- shared/components/file-upload
- shared/components/ai-prompt-editor
- shared/components/ai-response-panel
- shared/components/status-chip

## Component Change Safety
- Preserve OnPush.
- Keep input/output contracts explicit.
- Avoid cross-feature imports unless abstraction is truly generic.
