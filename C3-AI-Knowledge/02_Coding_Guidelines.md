# Coding Guidelines

## TypeScript and Angular
- Prefer standalone components.
- Use ChangeDetectionStrategy.OnPush by default.
- Use strong typing for DTOs and view models.
- Prefer readonly signals/computed for derived values.
- Keep component methods focused and small.

## State and Async
- Use signals for local UI state.
- Use computed for derived state.
- Use RxJS for async API composition.
- Keep side effects explicit in subscribe blocks.

## API Usage
- Do not call HttpClient directly in feature pages.
- Use AiApiService or feature service wrappers.
- Keep endpoint constants in api-endpoints.ts.
- Map external response models into page view models.

## Error and Loading
- Rely on global interceptors for standard behaviors.
- Show user-friendly errors in-page when needed.
- Keep loader and disabled states deterministic.

## Styling
- Use global tokens in styles.scss:
  - --bg, --panel, --ink, --muted, --line, --purple, etc.
- Do not hardcode light-only colors for form controls.
- Ensure dark mode readability for text, placeholders, and borders.

## Routing
- Each feature should own a routes file.
- Use lazy loading from app.routes.ts.
- Keep route title metadata meaningful.

## Naming
- Keep component names descriptive and feature-based.
- Use clear method names like generateCode, analyze, resetToInput.
- Keep interfaces close to where they are used unless shared.
