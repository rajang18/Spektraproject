# Theme Guide

## Theme System
Theme is controlled by ThemeService with modes:
- light
- dark

Persistence key:
- spektra.theme in localStorage

Theme application:
- sets data-theme attribute on documentElement
- sets colorScheme on documentElement

## Token Source
Global tokens are declared in src/styles.scss under:
- :root
- :root[data-theme='dark']

## Core Theme Rules
- Use CSS variables, not hardcoded colors, for surfaces and text.
- Form controls must be token-based (background, text, placeholder, border).
- Ensure icon and chip contrast in both modes.

## Existing Theme Controls
- Login page theme toggle button.
- Shell topbar theme toggle button.

## New Component Checklist
1. Use var(--panel), var(--ink), var(--muted), var(--line), etc.
2. Test on light and dark mode.
3. Verify hover/focus visibility.
4. Verify loader and empty-state readability.
