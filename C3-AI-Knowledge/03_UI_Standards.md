# UI Standards

## Layout System
- Main authenticated frame uses ShellComponent.
- Left sidenav for primary navigation.
- Top bar for search, theme toggle, notifications, and user menu.
- Feature content rendered in shell main area.

## Shared Visual Language
- Glass and panel surfaces are used across shell and login.
- Chips indicate status and priority.
- Buttons follow primary/outline/danger usage.
- Data tables use compact readable rows with chips and badges.

## Color and Theme
- Only use CSS tokens from global styles.
- Must support both light and dark theme.
- Placeholder, input text, and borders must remain readable in dark mode.

## Interaction Rules
- Always provide loading state for AI operations.
- Always provide error feedback for failed API calls.
- Disable submit buttons during invalid or loading state.
- Keep actions grouped at section headers or section bars.

## Accessibility Basics
- Add aria-label for icon-only buttons.
- Keep focus-visible clarity.
- Keep text contrast high in both themes.

## Responsive
- Shell uses compact and handset behavior via breakpoint observer.
- Feature pages should degrade to single-column layouts on narrow screens.
