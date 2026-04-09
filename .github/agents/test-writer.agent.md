name: test-writer
description: >
  Writes unit tests for backend routes and services.
  Does not modify production code.
tools:
  - read_file
  - grep
  - edit_file
---
 
You are a backend test specialist.
 
Rules:
- Only modify test files (tests/ or backend/tests/ or __tests__/ as appropriate for this repo).
- Do not modify production code (backend/src, backend/routes, backend/services).
- Use the existing test framework and conventions in the repo.
- If expected behavior is unclear, add a TODO in the test rather than changing implementation.
EOF
 
/delegate
@test-writer Add unit tests for backend routes and open a PR (or produce a reviewable diff). Do not modify production code; tests-only.
 
 
6) Plan the Azure AI Foundry feature (AI incident analysis)
 
CREATE AGENT FOR FOUNDARY INTEGRATION: 
.github/copilot-instructions.md 
# Copilot Instructions for Campus Incidents
 
## Project Overview
 
UChicago Help Desk incident reporting app. Express + React (Vite) monorepo with SQLite (sql.js).
 
## Tech Stack
 
- **Server**: Node.js, Express, CommonJS modules, sql.js (SQLite)
- **Client**: React 18, Vite, React Router, ESM
- **Tests**: Jest + supertest (server only)
- **Styling**: Inline styles with UChicago brand theme (maroon `#800000`)
 
## Commands
 
- `npm run dev` — Start both server and client (from root)
- `cd server && npm test` — Run server unit tests
- `cd client && npx vite build` — Build frontend
 
## Azure AI Foundry Integration
 
- **Endpoint pattern**: `{FOUNDRY_PROJECT_ENDPOINT}/models/chat/completions`
- **Auth header**: `api-key: {FOUNDRY_API_KEY}` (NOT `Authorization: Bearer`)
- **Use `max_completion_tokens`** instead of `max_tokens` for newer models (e.g., gpt-5.4-nano)
- **Do not use** `@azure-rest/ai-inference` SDK — use direct `fetch` calls for reliability
- Env vars: `FOUNDRY_PROJECT_ENDPOINT`, `FOUNDRY_MODEL_DEPLOYMENT_NAME`, `FOUNDRY_API_KEY`
- All AI errors must be caught server-side and return a safe fallback response (never expose to client)
 
## Code Conventions
 
- Server uses CommonJS (`require`/`module.exports`)
- Client uses ESM (`import`/`export`)
- Auth middleware is shared via `server/middleware/auth.js`
- Admin endpoints require Bearer token from `validTokens` set
- `.env` is loaded via `dotenv` from the project root — do not rely on shell environment variables
- No secrets in code; all credentials via `.env` (gitignored)
 
## Testing Conventions
 
- Mock external dependencies (AI client, database) in unit tests
- Use `supertest` to test Express routes without starting the real server
- Test both success and failure paths, including auth and validation
 