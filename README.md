# Airia Auto-Operator (Hackathon Demo)

Demo-first implementation of the Airia Auto-Operator concept with:

1. API-driven setup/provisioning (`scripts/bootstrap.ts`)
2. Human-in-the-loop approval at runtime before external email
3. Visible live orchestration in a local UI

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and update values as needed.

3. Run demo startup:

```bash
npm run demo:up
```

4. Open `http://localhost:3000`.

## Scripts

1. `npm run demo:up` runs bootstrap then starts the local app.
2. `npm run bootstrap` provisions or updates Airia resources via API.
3. `npm run demo:reset` resets in-memory demo state.
4. `npm run typecheck` runs TypeScript checks.

## Environment

Required for local demo mode:

1. `PORT`
2. `APP_BASE_URL`

Optional for real Airia API provisioning:

1. `AIRIA_API_BASE_URL`
2. `AIRIA_API_KEY`
3. `AIRIA_PROJECT_ID`

If `AIRIA_API_KEY` is unset, the app still runs end-to-end in local simulation mode.

## API Endpoints

1. `POST /api/workflow/run`
2. `GET /api/workflow/:id/stream` (SSE)
3. `POST /api/workflow/approve`
4. `GET /api/workflow/:id`
5. `GET /api/tools/crm?name=...`
6. `POST /api/tools/tasks`
7. `POST /api/tools/email`
8. `POST /api/tools/slack`
