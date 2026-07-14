# Add Customer Example

## Requirement
Add a new Add Customer workflow with form, validation, save API, and list refresh.

## Existing Reusable Patterns
- Form classes: form-input, form-select, form-textarea
- API pattern: BaseApiService/AiApiService + endpoint constants
- UI shell and routing pattern: feature route + lazy load
- Status display: chips and data-table patterns

## Suggested Implementation In This Project
1. Create feature folder: features/customer
2. Add route file and page component.
3. Add customer service with typed DTOs.
4. Add API endpoint constants.
5. Add page with input/loading/error/success states.
6. Add navigation entry in shell if needed.

## Files To Change
- src/app/app.routes.ts
- src/app/core/layout/shell/shell.component.ts (if nav item needed)
- src/app/core/api/api-endpoints.ts
- src/app/features/customer/... (new)

## Validation Checklist
- Dark mode readability
- Mobile form layout
- API error handling
- Loading disabled submit behavior
