# Best Practices

## Feature Delivery
- Start by mapping requirement to existing feature and route.
- Reuse existing patterns before introducing new architecture.
- Keep changes minimal and incremental.

## Code Quality
- Strongly type request/response and local view models.
- Keep methods focused and readable.
- Keep side effects in controlled points.

## UX Quality
- Always include loading, success, empty, and error states.
- Keep actions disabled during in-flight requests.
- Keep dark mode and mobile behavior verified.

## Security and Auth
- Keep token logic inside auth services/interceptors.
- Do not pass tokens manually in components.
- Keep protected routes behind authGuard.

## API Reliability
- Use centralized endpoint constants.
- Preserve interceptor pipeline.
- Surface user-safe error messages.

## Maintainability
- Keep shared truly generic.
- Keep feature-specific logic in feature folder.
- Prefer local feature abstractions over broad global abstractions.
