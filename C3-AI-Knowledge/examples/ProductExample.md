# Product Example

## Requirement
Create Product management with list, filters, create/edit form, and delete confirmation.

## Existing Reusable Patterns
- Shared confirmation dialog for delete confirmation.
- Shared DataTableComponent for simple list tables.
- Form styling and theme token usage.

## Suggested Design
- Product list page route.
- Product form page route (create/edit mode).
- Product service with typed DTOs and endpoint constants.
- Confirmation dialog before delete.

## Best-Fit Current Conventions
- OnPush components.
- Signals for page state.
- Typed service responses.
- Global error and loading via interceptors.
