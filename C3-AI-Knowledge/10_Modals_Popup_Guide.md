# Modals Popup Guide

## Current Implementation
A shared confirmation dialog exists:
- shared/components/confirmation-dialog/confirmation-dialog.component.ts

It uses:
- MatDialogModule
- MatButtonModule
- data contract: title, message, optional confirmLabel

## Usage Pattern
- Open modal for destructive or irreversible actions.
- Keep message short and explicit.
- Confirm action should return boolean true on acceptance.

## Recommended Extension
For future popups:
- Create standalone dialog component in shared/components.
- Keep dialog data typed.
- Avoid embedding business service calls directly inside shared dialog component.

## UX Rules
- Always provide cancel path.
- Keep keyboard accessibility (ESC/Enter) default unless business-critical.
- Use danger styling for destructive actions.
