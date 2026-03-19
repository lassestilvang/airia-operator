# 🚀 Airia Auto-Operator — Full Implementation Spec

## 🧠 Overview

**Airia Auto-Operator** is an enterprise AI system built on Airia’s agent orchestration platform. It accepts a high-level business goal and autonomously executes a multi-step workflow across enterprise tools using specialized agents.

### Core Example

Input:

> "Onboard Acme Corp (Enterprise Plan, 200 seats)"

System:

* Plans workflow using Airia
* Orchestrates multiple agents
* Executes actions across tools (CRM, Docs, Ops, Comms)
* Enforces governance rules
* Requests human approval when required

---

# 🎯 Goals

* Demonstrate **Airia-native agent orchestration**
* Execute **real actions**, not just suggestions
* Show **multi-agent collaboration**
* Include **governance + human-in-the-loop**
* Provide **clear observability of execution**

---

# 🧩 System Architecture

## 1. Airia Platform (Core Engine)

Responsible for:

* Planning
* Agent orchestration
* Context passing
* Execution lifecycle
* Governance enforcement
* Observability

## 2. Agents (Defined in Airia)

Each agent must be independently defined with:

* name
* description
* inputs
* outputs
* tools
* prompt

### 2.1 CRM Agent

**Purpose:** Retrieve customer data

**Inputs:**

* company_name (string)

**Outputs:**

```json
{
  "company_name": "string",
  "plan": "string",
  "seats": number,
  "contact_email": "string",
  "status": "string"
}
```

**Tool:**

* GET /mock-crm/customer?name={company_name}

---

### 2.2 Docs Agent

**Purpose:** Generate onboarding documentation

**Inputs:**

* customer_profile (object)

**Outputs:**

```json
{
  "doc_markdown": "string"
}
```

**Prompt Behavior:**

* Generate structured onboarding guide
* Include:

  * welcome message
  * setup steps
  * assigned responsibilities

---

### 2.3 Ops Agent

**Purpose:** Create onboarding tasks

**Inputs:**

* customer_profile
* doc_reference

**Outputs:**

```json
{
  "tasks": [
    {
      "title": "string",
      "owner": "string",
      "status": "created"
    }
  ]
}
```

**Tool:**

* POST /mock-tasks

---

### 2.4 Comms Agent

**Purpose:** Send communications

**Inputs:**

* customer_profile
* doc_markdown

**Outputs:**

```json
{
  "email_sent": boolean,
  "slack_notified": boolean
}
```

**Tools:**

* POST /send-email
* POST /send-slack

---

### 2.5 Governance Agent (CRITICAL)

**Purpose:** Enforce enterprise rules

**Rules:**

* External email requires approval
* Missing required fields → block execution

**Inputs:**

* planned_action
* context

**Outputs:**

```json
{
  "approved": boolean,
  "requires_human": boolean,
  "reason": "string"
}
```

---

# 🔄 Airia Workflow Definition

## Workflow Name:

`enterprise_customer_onboarding`

---

## Input Schema

```json
{
  "goal": "string"
}
```

---

## Execution Flow

### Step 1 — Plan

Airia interprets goal:

* Extract company name
* Identify onboarding intent

---

### Step 2 — CRM Agent

Fetch customer data

---

### Step 3 — Docs Agent

Generate onboarding documentation

---

### Step 4 — Ops Agent

Create internal onboarding tasks

---

### Step 5 — Governance Check (Pre-Comms)

Validate:

* Is email allowed?
* Is approval required?

---

### Step 6 — Human Approval (if required)

UI must present:

```json
{
  "message": "Approve sending onboarding email to Acme Corp?",
  "actions": ["approve", "reject"]
}
```

---

### Step 7 — Comms Agent

* Send email
* Send Slack notification

---

### Step 8 — Final Output

```json
{
  "status": "completed",
  "summary": {
    "tasks_created": number,
    "email_sent": boolean,
    "slack_sent": boolean
  }
}
```

---

# 🧠 Agent Prompt Templates

## Global Rules (apply to all agents)

* Be concise and structured
* Always return valid JSON
* Never hallucinate tool results
* Use provided context only

---

## Planner Behavior (Airia)

* Break goal into ordered steps
* Select correct agents
* Pass outputs between agents

---

## CRM Agent Prompt

"You are a CRM agent. Retrieve structured customer data using the provided tool. Do not infer missing data."

---

## Docs Agent Prompt

"You generate onboarding documentation for enterprise customers. Output clean markdown."

---

## Ops Agent Prompt

"You create actionable onboarding tasks for internal teams. Tasks must be clear and assignable."

---

## Comms Agent Prompt

"You communicate with customers professionally. Email must be clear, concise, and actionable."

---

## Governance Agent Prompt

"You enforce enterprise safety rules. Block or require approval when necessary."

---

# 🖥️ Frontend Requirements

## Minimal UI

### 1. Input Box

* Accepts goal string

---

### 2. Execution Log (LIVE)

Display:

* step name
* agent name
* status

Example:

```
✔ CRM Agent → fetched customer data
✔ Docs Agent → generated onboarding doc
✔ Ops Agent → created tasks
⏳ Awaiting approval...
```

---

### 3. Approval Component

* Show message
* Buttons:

  * Approve
  * Reject

---

### 4. Final Summary View

* Tasks created
* Email sent
* Slack notified

---

# 🔌 API Layer (Your App)

## POST /run-workflow

Request:

```json
{
  "goal": "Onboard Acme Corp (Enterprise Plan, 200 seats)"
}
```

Response:

* stream events OR polling status

---

## POST /approve

```json
{
  "workflow_id": "string",
  "decision": "approve" | "reject"
}
```

---

# 🧪 Mock Services

## CRM

```json
{
  "company_name": "Acme Corp",
  "plan": "Enterprise",
  "seats": 200,
  "contact_email": "admin@acme.com"
}
```

---

## Tasks

* Store in memory or JSON file

---

## Email

* Log instead of actually sending (acceptable)

---

## Slack

* Webhook or log

---

# 🧨 Key Differentiators (MUST IMPLEMENT)

## 1. Visible Agent Orchestration

* Show which agent runs each step

---

## 2. Governance Enforcement

* Must block or pause execution

---

## 3. Human-in-the-loop

* Required for email sending

---

## 4. Real Tool Calls

* Even if mocked

---

# ⚡ Optional Enhancements

* Retry failed steps
* Editable execution plan
* Agent reasoning trace
* Persistent memory (Redis)

---

# 🏁 Success Criteria

* One input triggers full workflow
* Multiple agents execute in sequence
* Approval step interrupts flow
* External actions only after approval
* UI clearly shows orchestration

---

# 🎤 Demo Script (for final submission)

1. Enter onboarding request
2. Show Airia orchestrating agents
3. Show live execution logs
4. Pause at approval
5. Approve
6. Show final result

---

# 🔥 Final Note

This project MUST emphasize:

* Airia as the orchestrator
* Agents as first-class entities
* Real execution across systems

If implemented correctly, this will feel like:

> “An AI employee powered by Airia”
