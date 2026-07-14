# Project Response Flow (Short Explainer)

This guide explains both major screens now available in the app:
- Requirement to Code
- C3 Project Knowledge Copilot (Knowledge Mode)

---

## A) Requirement to Code Flow

This is a simple step-by-step guide for how this project responds when a user asks something in the Requirement to Code screen.

## 1. User submits requirement in UI
- User types requirement text in the Angular page.
- If AI asked clarification questions earlier, user fills those answers.
- User clicks `Generate with AI` or `Re-generate with Clarifications`.

## 2. Frontend sends request to backend
- Angular client calls the Requirement-to-Code API endpoint.
- Request includes:
  - `requirement`
  - `targetFramework`
  - optional `clarificationAnswers`

## 3. Backend validates request
- Express route validates payload schema.
- If payload is invalid, backend returns validation error.
- If valid, request goes to OpenAI service layer.

## 4. Backend prepares AI context
- Adds static C3 project knowledge (MSAL, routing, i18n, conventions).
- Adds dynamic source retrieval from extracted C3 source (`_main_src/src`).
- Runs deterministic code-check precheck for code-audit style requests (for example hardcoded string scan) and injects findings.

## 5. Backend calls LLM with strict JSON schema
- OpenAI request is sent with a strict response schema.
- Model must return structured JSON fields (summary, files, notes, risks, clarification flags).

## 6. Clarification logic
- If requirement is incomplete, AI can return clarification questions.
- Frontend shows those questions and collects answers.
- On regenerate with answers, backend forces final mode (no repeat clarification loop).

## 7. Final artifacts are generated
- Backend returns structured implementation artifacts.
- Frontend then triggers additional AI calls for Jira tasks and test cases.
- UI shows combined output in tabs (overview, notes, risks, jira, tests, code).

## 8. Local persistence
- Frontend saves both:
  - user `requirementText`
  - generated AI artifacts
- On refresh/reopen, user can see what was asked and what AI returned.

## 9. Error handling
- If OpenAI fails, backend returns a standardized error response with correlation ID.
- Frontend shows error message and keeps user on input screen.

---

## One-line summary (Requirement Mode)
User input -> validated backend request -> C3 context + code precheck -> strict JSON LLM response -> clarification (if needed) -> final artifacts -> UI tabs + local persistence.

---

## B) Project Knowledge Copilot Flow

This is the flow for the newly added Knowledge screen (`/knowledge-copilot`). It now works with any project zip you place at repository root.

## Zip swap behavior (important)
- If you replace the root `.zip` with another project zip, the tool can answer for that project as well.
- Backend auto-detects zip files from repository root and picks the latest modified `.zip`.
- You can also explicitly select which zip to use from the new ZIP picker in Knowledge Mode.
- Reindex is used to rebuild embeddings/chunks for the new project.
- After reindex, chat/search/explain/code responses are grounded in the newly indexed project.

## 1. User opens Knowledge Mode
- User navigates to `Knowledge Mode` from the Requirement page switch.
- UI loads current project index status (zip readiness, file count, chunk count).
- UI loads available zip files and currently active zip for explicit selection.
- UI also loads available conversation sessions for the session picker.

## 1.1 Optional explicit zip selection
- User chooses a zip file in the `Source ZIP` dropdown.
- User clicks `Apply ZIP`.
- Backend sets active zip, reindexes immediately, and returns updated status.
- Existing features (chat/search/explain/code/session history) continue working on the selected project.

## 2. User chooses or creates a session
- User can select an existing session from the session dropdown.
- UI fetches that session history and restores chat messages.
- User can click `New Session` to start a fresh conversation id.

## 3. User asks a project question
- User types a question in the composer and clicks `Ask Copilot`.
- Frontend starts streaming request through SSE (`GET /chat/stream`) with:
  - `question`
  - `conversationId`

## 4. Backend classifies and retrieves context
- Backend detects if query is C3-related.
- For C3 queries, backend runs hybrid retrieval (semantic + keyword) on indexed chunks.
- Backend builds compressed context and conversation summary.

## 5. Streaming response back to UI
- SSE events are streamed in order:
  - `meta` (started)
  - `delta` (incremental text chunks)
  - `done` (final structured response payload)
  - `error` (if stream fails)
- UI updates the assistant message live as `delta` chunks arrive.
- User can click `Cancel Stream` to stop the active EventSource immediately.

## 6. Persistent conversation storage
- Every completed turn is saved in backend disk storage:
  - `SpektraApi/data/project-index/chat-memory.json`
- Session list/history APIs expose this data:
  - `GET /api/v1/project-knowledge/conversations?limit=50`
  - `GET /api/v1/project-knowledge/conversations/:conversationId`

## 7. Citation-driven code exploration
- Response includes file citations (`filesUsed`) and relevant snippets.
- User clicks a citation in `Files Used`.
- UI fetches full file content from `/project/code` and opens it in the right-side code viewer.
- Viewer shows:
  - selected file path
  - selected chunk label
  - syntax-highlighted code with line numbers

## 8. Reindex and health checks
- User can click `Refresh Status` to re-check index health.
- User can click `Reindex Project` to rebuild chunks after source zip updates.

## 9. Error handling in Knowledge Mode
- SSE or API failures surface in the same error banner.
- If file fetch for viewer fails, fallback text is shown in code panel.
- Existing conversation history remains intact.

## One-line summary (Knowledge Mode)
Pick session -> ask question -> backend retrieves project context -> stream answer live -> save turn to persistent history -> open citations in highlighted code viewer.

Use `Refresh Status` and `Reindex Project` after changing the zip so answers switch to the new project context.

---

## How To Use The New Project Knowledge Copilot Screen

## Quick start
1. Open `Knowledge Mode`.
2. Confirm status shows ZIP/index ready.
3. Choose an existing session or click `New Session`.
4. Ask a focused project question (for example: "Explain auth redirect flow and relevant files").
5. Watch streaming answer. Use `Cancel Stream` if needed.
6. Click any cited file in `Files Used` to inspect code in the side viewer.

## Recommended question styles
- Architecture: "Explain tenant onboarding flow and modules involved."
- Code tracing: "Where is auth token attached to API requests?"
- Impact analysis: "If I change X service, which components/routes are impacted?"
- Feature discovery: "Show files related to quote approval and summarize responsibilities."

## Best practices
- Keep one topic per question for better retrieval quality.
- Reuse the same session for follow-up questions to preserve context.
- Start a new session when switching to a completely different feature area.
- Reindex after replacing/updating source zip so search reflects latest code.

## Can this be used as a reusable engineering assistant tool?
Yes. With zip-swap + reindex, it can act as a project copilot for:
- understanding architecture and flow,
- locating implementation points,
- debugging/fixing issues from logs/errors,
- suggesting safe code-level changes based on retrieved context.
