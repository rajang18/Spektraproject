# Translation Guide

## Current Status
- No i18n or translation library is currently integrated.
- UI strings are hardcoded in templates/components.

## Impact
- Multi-language support is not yet available.
- Text updates currently require code changes.

## Recommended Future Direction
Option A:
- Angular built-in i18n extraction and build-time translations.

Option B:
- Runtime translation library (example: ngx-translate) for dynamic language switching.

## Suggested Migration Plan
1. Extract user-facing strings into centralized keys.
2. Add translation files per language.
3. Build translation pipe/directive usage pattern.
4. Add language selector in Settings page.
5. Add default locale and fallback behavior.

## Rule For New Features Until i18n Exists
- Keep strings grouped and easy to find.
- Avoid duplicating long repeated text across components.
