# Spektra API

Enterprise Express.js backend for the Spektra AI Engineering Copilot platform.

## Package versions

- API package version: `0.1.0`
- Node.js version tested: `22.12.0`

## Local setup

From the repository root:

```bash
cd SpektraApi
npm install
```

## Run the API

```bash
npm run dev
```

This starts the API in watch mode via `tsx`.

## Build for production

```bash
npm run build
npm start
```

## Environment

Copy `.env.example` to `.env` and set your OpenAI key.

Example:

```bash
OPENAI_API_KEY=replace-with-your-openai-api-key
OPENAI_MODEL=gpt-5.5
OPENAI_TIMEOUT_MS=120000
OPENAI_MAX_RETRIES=3
OPENAI_RETRY_BASE_DELAY_MS=500
OPENAI_RETRY_MAX_DELAY_MS=5000
```

## API endpoints

- `POST /api/v1/requirement-to-code/generate`
- `POST /api/v1/log-analyzer/analyze`
- `POST /api/v1/test-case-generator/generate`
- `POST /api/v1/jira-task-generator/generate`

## Example usage

```bash
curl -X POST http://localhost:5000/api/v1/requirement-to-code/generate \
  -H "Content-Type: application/json" \
  -d '{"requirement":"Build a dynamic employee onboarding workflow."}'
```

## Notes

- The OpenAI integration is implemented in `src/core/openai/openai.service.ts`.
- Request validation is handled with Zod schemas in feature modules.
- The API uses `express`, `pino`, `helmet`, and `cors` for production readiness.
