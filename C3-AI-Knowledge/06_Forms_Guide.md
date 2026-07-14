# Forms Guide

## Forms In Current Codebase
- Reactive Forms: login page.
- Template-driven Forms: several generator pages using ngModel.
- Shared classes for controls: form-input, form-select, form-textarea.

## Validation Pattern
- Disable primary action when input is invalid or incomplete.
- Show clear error text near form or section.
- Keep minimum requirement checks explicit in component logic.

## Textarea Pattern
- Use class form-textarea.
- Show char-count for long text inputs.
- Ensure dark mode readability using token-based background and text colors.

## Suggested New Feature Form Pattern
1. Define typed model for payload.
2. Keep form state local with signal or form group.
3. Validate required fields before API call.
4. Show loading and in-page error message.
5. Keep submission idempotent while request is in progress.

## File Input Pattern
- Validate extension and size before sending.
- Keep accepted extensions explicit constants.
- Surface friendly error for invalid files.
