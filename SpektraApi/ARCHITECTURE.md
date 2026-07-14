# Spektra API Architecture

Enterprise Node.js Express backend for an AI Engineering Copilot platform.

## Folder Structure

```txt
SpektraApi/
  src/
    app.ts
    server.ts
    config/
      cors.config.ts
      environment.ts
      logger.ts
    core/
      errors/
        app-error.ts
      middleware/
        async-handler.ts
        error-handler.middleware.ts
        not-found.middleware.ts
        request-id.middleware.ts
        request-logger.middleware.ts
        validate-request.middleware.ts
      openai/
        openai.client.ts
        openai.service.ts
      utils/
        api-response.ts
    features/
      requirement-to-code/
        requirement-to-code.controller.ts
        requirement-to-code.routes.ts
        requirement-to-code.schema.ts
        requirement-to-code.service.ts
      log-analyzer/
      test-case-generator/
      jira-task-generator/
    routes/
      api.routes.ts
```

## Express App Setup

`src/app.ts` creates the Express app and wires:

- `helmet` for secure HTTP headers
- `cors` with configured client origins
- `compression`
- JSON and URL-encoded body parsers
- `express-rate-limit`
- correlation ID middleware
- request logging
- `/health`
- versioned API routes under `API_PREFIX`
- not found and error handlers

`src/server.ts` starts the app and handles graceful shutdown.

## Middleware Setup

Core middleware:

- `request-id.middleware.ts`: assigns or forwards `X-Correlation-Id`
- `request-logger.middleware.ts`: structured HTTP logging through `pino-http`
- `validate-request.middleware.ts`: validates body, params, and query using Zod
- `error-handler.middleware.ts`: normalizes validation, business, and unexpected errors
- `not-found.middleware.ts`: returns consistent 404 responses
- `async-handler.ts`: wraps async controllers safely

## API Routes

Base prefix defaults to `/api/v1`.

```txt
POST /api/v1/requirement-to-code/generate
POST /api/v1/log-analyzer/analyze
POST /api/v1/test-case-generator/generate
POST /api/v1/jira-task-generator/generate
GET  /health
```

## Controller Pattern

Controllers are thin. They read validated request data, call a service, and return a consistent API response:

```ts
const result = await requirementToCodeService.generateCode(request.body);
response.status(200).json(ok(result, response.locals['correlationId']));
```

## Service Pattern

Services own business logic and AI prompt construction. They call the shared OpenAI service:

```ts
const content = await openAiService.generateText({
  systemPrompt: 'You are a senior software engineer...',
  userPrompt: request.requirement
});
```

## Environment Variables

```txt
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1
CLIENT_ORIGIN=http://localhost:4200
REQUEST_BODY_LIMIT=1mb
LOG_LEVEL=info

OPENAI_API_KEY=replace-with-your-openai-api-key
OPENAI_MODEL=gpt-4.1-mini
OPENAI_TIMEOUT_MS=120000

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=120
```

## Security Best Practices

- Do not commit `.env`.
- Use `helmet`.
- Restrict CORS origins per environment.
- Use rate limiting.
- Validate all incoming request bodies.
- Do not log API keys or authorization headers.
- Forward `X-Correlation-Id` through logs and API responses.
- Keep controllers thin and test services independently.
- Set request body limits.
- Use production-grade secret management outside local development.
