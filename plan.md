# 🚀 Implementation Plan: Airia Auto-Operator (Hackathon Lean)

This is a **demo-first**, API-driven plan. It prioritizes reliability for a live hackathon demo without over-engineering. Setup and provisioning are fully automated, while runtime governance intentionally includes human approval.

## 1. Decisions Locked In

1. Default runtime mode is `APPROVAL_MODE=manual` for the demo approval step.
2. Setup/provisioning is fully automated via Airia API (no Airia UI clicking).
3. Runtime state is in-memory only.
4. Demo runs locally.
5. Provisioned Airia resources are preserved between runs (no auto teardown).

## 2. Automation Boundary (Explicit)

1. No human interaction is required for implementation, setup, or provisioning.
2. Human interaction is required at runtime for the governance approval step (hackathon requirement).
3. No manual Airia UI configuration is required at any point.

## 3. Demo Success Criteria

1. Fresh start to working app with scripted setup.
2. One input goal runs full workflow end-to-end.
3. UI visibly shows agent-by-agent orchestration.
4. Flow pauses at governance approval before sending email.
5. Approve resumes and completes with summary output.

## 4. Lean Architecture

1. One backend service for mock tools + workflow API.
2. One frontend app for input, logs, approval, and summary.
3. One bootstrap script that configures Airia tools, agents, and workflow.
4. In-memory stores for workflow logs, tasks, email logs, and slack logs.

## 5. Automation Scope (Must-Have)

### 5.1 Bootstrap Script

`scripts/bootstrap.ts` should:

1. Authenticate with Airia API key.
2. Upsert tools:
   1. `mock-crm`
   2. `mock-tasks`
   3. `send-email`
   4. `send-slack`
3. Upsert agents:
   1. CRM Agent
   2. Docs Agent
   3. Ops Agent
   4. Comms Agent
   5. Governance Agent
4. Upsert workflow `enterprise_customer_onboarding`.
5. Register required webhook/callback endpoint(s).
6. Be idempotent so reruns are safe.

### 5.2 Demo Startup Script

`npm run demo:up` should:

1. Validate required env vars.
2. Start backend + frontend.
3. Run bootstrap automatically.
4. Print local app URL and ready status.

## 6. Backend Endpoints

### 6.1 Mock Tool Endpoints (Airia Calls These)

1. `GET /api/tools/crm?name={company}`
2. `POST /api/tools/tasks`
3. `POST /api/tools/email`
4. `POST /api/tools/slack`

### 6.2 Workflow Endpoints (Frontend Calls These)

1. `POST /api/workflow/run`
2. `GET /api/workflow/:id/stream` (SSE)
3. `POST /api/workflow/:id/approve`
4. `GET /api/workflow/:id` (polling fallback)

## 7. Frontend (Minimal But Clear)

1. Goal input box (prefilled with Acme onboarding request).
2. Live execution log with step, agent, and status.
3. Approval modal when governance returns `requires_human=true`.
4. Final summary showing tasks created, email sent, slack sent.

## 8. Workflow Sequence To Implement

1. Planner parses onboarding goal.
2. CRM Agent fetches customer profile.
3. Docs Agent generates onboarding markdown.
4. Ops Agent creates onboarding tasks.
5. Governance Agent checks communication action.
6. If manual approval required, pause and wait for decision.
7. Comms Agent sends email and slack after approval.
8. Return final summary payload.

## 9. Governance Behavior (Simple)

1. Missing required fields blocks flow.
2. Sending external email requires approval in manual mode.
3. Reject decision ends workflow with `rejected` status.
4. Approve decision resumes to Comms step.

## 10. Data Strategy (Hackathon)

1. Keep all runtime data in memory for speed.
2. Seed one known CRM customer (`Acme Corp`).
3. Keep logs deterministic and readable for demo narration.
4. Add a lightweight `demo:reset` command to clear in-memory state.

## 11. Testing (Just Enough)

1. Bootstrap runs successfully from clean state.
2. Happy path test: run workflow and approve.
3. Rejection path test: run workflow and reject.
4. Idempotency check: rerun bootstrap and ensure no duplicate resource creation.

## 12. Scope Guardrails (Avoid Over-Engineering)

1. No database required for MVP.
2. No complex retry framework beyond basic error handling.
3. No full CI/CD pipeline required for demo submission.
4. No teardown automation by default (preserve resources for rapid reruns).
5. Optional extras only if core flow is already solid.

## 13. Build Order (Fastest Path)

1. Implement backend mock tool endpoints.
2. Implement bootstrap script to provision Airia resources.
3. Implement workflow run + stream + approve backend endpoints.
4. Implement minimal frontend (input, live log, approval modal, summary).
5. Add `demo:up` and `demo:reset` scripts.
6. Dry-run full demo script repeatedly until it is stable.
