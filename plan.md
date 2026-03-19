# 🚀 Implementation Plan: Airia Auto-Operator

This document outlines the end-to-end implementation plan for the **Airia Auto-Operator** hackathon project. The core focus is on **100% automated setup** via the Airia API, robust agent orchestration, and a clear, demonstrable human-in-the-loop workflow.

## 1. Tech Stack
- **Backend/Orchestration:** Node.js (TypeScript) with Express.js or Hono.
- **Frontend:** Next.js (React) with Tailwind CSS (minimal, clean UI).
- **Integration:** Airia REST API / SDK (for automated setup and workflow execution).
- **State Management:** In-memory or local SQLite (for mock services and tracking workflow states during the demo).

## 2. Phase 1: Automated Airia Setup (Zero-Touch Provisioning)
**Goal:** No clicking through the Airia UI to set up agents. A bootstrap script configures the entire Airia environment programmatically.

- **`scripts/bootstrap.ts`**:
  1. **Authenticate** with Airia API using an API key.
  2. **Register Tools**: Create the mock tools in Airia (`mock-crm`, `mock-tasks`, `send-email`, `send-slack`) pointing to our local backend endpoints (e.g., using ngrok for local dev).
  3. **Create Agents**:
     - Programmatically create **CRM Agent**, **Docs Agent**, **Ops Agent**, **Comms Agent**, and the **Governance Agent**.
     - Inject the exact JSON schemas for inputs/outputs, system prompts, and tool bindings for each agent.
  4. **Create Workflow**: Define the `enterprise_customer_onboarding` workflow, sequencing the agents and configuring the Governance step to trigger a pause/webhook for human approval.

## 3. Phase 2: Backend API & Mock Services
**Goal:** Serve the frontend, handle Airia webhooks/execution, and simulate enterprise systems.

- **Mock Tool Endpoints (Called by Airia):**
  - `GET /api/tools/crm?name={company}`: Returns static JSON for "Acme Corp".
  - `POST /api/tools/tasks`: Logs task creation to memory.
  - `POST /api/tools/email`: Logs email content to memory.
  - `POST /api/tools/slack`: Logs slack message to memory.
- **Workflow Endpoints (Called by Frontend):**
  - `POST /api/workflow/run`: Accepts the user's goal, calls Airia API to start the workflow, and returns a `workflow_id`.
  - `GET /api/workflow/:id/stream`: Uses Server-Sent Events (SSE) to stream live execution logs from Airia to the frontend (showing agent transitions).
  - `POST /api/workflow/:id/approve`: Sends the user's approval/rejection back to Airia to resume the paused Governance step.

## 4. Phase 3: Frontend Implementation
**Goal:** Build a demo-optimized UI that highlights Airia's orchestration and the human-in-the-loop requirement.

- **Hero Section:** Simple input box pre-filled with: `"Onboard Acme Corp (Enterprise Plan, 200 seats)"`.
- **Live Orchestration View:**
  - A visual timeline or terminal-style output.
  - Distinct visual indicators when execution passes from Airia Planner → CRM Agent → Docs Agent → Ops Agent.
- **Governance Modal (Human-in-the-loop):**
  - When the SSE stream emits a `pending_approval` state from the Governance agent, blur the background and show an Approval modal.
  - Display context: "Approve sending onboarding email to Acme Corp?"
  - Buttons: **Approve** (resumes flow) / **Reject** (halts flow).
- **Summary Dashboard:**
  - Renders upon workflow completion.
  - Displays structured data: Tasks Created, Email Sent (boolean), Slack Notified (boolean).

## 5. Phase 4: Testing & Demo Polish
- **End-to-End Test:** Run `npm run bootstrap` to configure Airia, start the server, and click through the UI to ensure the happy path works seamlessly.
- **Error Handling:** Ensure the UI gracefully handles workflow rejections at the Governance step.
- **Demo Script Alignment:** Verify the UI strictly follows the 6-step demo script outlined in the spec.

## Next Steps for Execution
1. Initialize the monorepo (Next.js + Express/API routes).
2. Obtain Airia API keys and write the `bootstrap.ts` script.
3. Build the mock endpoints.
4. Wire up the frontend UI and SSE stream.
