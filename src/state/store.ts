import { randomUUID } from 'node:crypto'

import type { CustomerProfile, OnboardingTask, ToolCallLog, WorkflowEvent, WorkflowState } from '../types/index.js'

interface StoreState {
  workflows: Map<string, WorkflowState>
  toolLogs: ToolCallLog[]
  crmProfiles: Map<string, CustomerProfile>
}

const defaultCustomerProfile: CustomerProfile = {
  company_name: 'Acme Corp',
  plan: 'Enterprise',
  seats: 200,
  contact_email: 'admin@acme.com',
  status: 'active',
}

function createInitialState(): StoreState {
  const crmProfiles = new Map<string, CustomerProfile>()
  crmProfiles.set(defaultCustomerProfile.company_name.toLowerCase(), defaultCustomerProfile)

  return {
    workflows: new Map<string, WorkflowState>(),
    toolLogs: [],
    crmProfiles,
  }
}

const state = createInitialState()

function nowIso(): string {
  return new Date().toISOString()
}

export function resetState(): void {
  const next = createInitialState()
  state.workflows = next.workflows
  state.toolLogs = next.toolLogs
  state.crmProfiles = next.crmProfiles
}

export function createWorkflow(goal: string): WorkflowState {
  const workflow: WorkflowState = {
    id: randomUUID(),
    goal,
    status: 'queued',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    tasks: [],
    emailSent: false,
    slackSent: false,
    awaitingApproval: false,
    events: [],
  }

  state.workflows.set(workflow.id, workflow)
  return workflow
}

export function getWorkflow(workflowId: string): WorkflowState | undefined {
  return state.workflows.get(workflowId)
}

export function getWorkflows(): WorkflowState[] {
  return Array.from(state.workflows.values())
}

export function updateWorkflow(workflowId: string, updater: (workflow: WorkflowState) => void): WorkflowState {
  const workflow = state.workflows.get(workflowId)
  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`)
  }

  updater(workflow)
  workflow.updatedAt = nowIso()
  state.workflows.set(workflowId, workflow)
  return workflow
}

export function addWorkflowEvent(workflowId: string, event: Omit<WorkflowEvent, 'id' | 'workflowId' | 'timestamp'>): WorkflowEvent {
  const payload: WorkflowEvent = {
    id: randomUUID(),
    workflowId,
    timestamp: nowIso(),
    ...event,
  }

  updateWorkflow(workflowId, (workflow) => {
    workflow.events.push(payload)
    workflow.status = event.status
  })

  return payload
}

export function getEvents(workflowId: string): WorkflowEvent[] {
  const workflow = state.workflows.get(workflowId)
  return workflow?.events ?? []
}

export function addToolLog(type: ToolCallLog['type'], payload: Record<string, unknown>): ToolCallLog {
  const log: ToolCallLog = {
    id: randomUUID(),
    type,
    timestamp: nowIso(),
    payload,
  }
  state.toolLogs.push(log)
  return log
}

export function getToolLogs(): ToolCallLog[] {
  return state.toolLogs
}

export function findCustomerProfile(companyName: string): CustomerProfile | undefined {
  return state.crmProfiles.get(companyName.toLowerCase())
}

export function addCustomerProfile(profile: CustomerProfile): void {
  state.crmProfiles.set(profile.company_name.toLowerCase(), profile)
}

export function setWorkflowCustomerProfile(workflowId: string, profile: CustomerProfile): void {
  updateWorkflow(workflowId, (workflow) => {
    workflow.customerProfile = profile
  })
}

export function setWorkflowDocMarkdown(workflowId: string, docMarkdown: string): void {
  updateWorkflow(workflowId, (workflow) => {
    workflow.docMarkdown = docMarkdown
  })
}

export function setWorkflowTasks(workflowId: string, tasks: OnboardingTask[]): void {
  updateWorkflow(workflowId, (workflow) => {
    workflow.tasks = tasks
  })
}

export function setWorkflowApprovalState(workflowId: string, awaitingApproval: boolean): void {
  updateWorkflow(workflowId, (workflow) => {
    workflow.awaitingApproval = awaitingApproval
  })
}

export function setWorkflowCommsState(workflowId: string, sent: { emailSent: boolean; slackSent: boolean }): void {
  updateWorkflow(workflowId, (workflow) => {
    workflow.emailSent = sent.emailSent
    workflow.slackSent = sent.slackSent
  })
}

export function completeWorkflow(workflowId: string): void {
  updateWorkflow(workflowId, (workflow) => {
    workflow.status = 'completed'
    workflow.awaitingApproval = false
    workflow.summary = {
      tasks_created: workflow.tasks.length,
      email_sent: workflow.emailSent,
      slack_sent: workflow.slackSent,
    }
  })
}

export function rejectWorkflow(workflowId: string, reason: string): void {
  updateWorkflow(workflowId, (workflow) => {
    workflow.status = 'rejected'
    workflow.awaitingApproval = false
    workflow.rejectedReason = reason
  })
}

export function failWorkflow(workflowId: string, error: string): void {
  updateWorkflow(workflowId, (workflow) => {
    workflow.status = 'failed'
    workflow.awaitingApproval = false
    workflow.error = error
  })
}

export function setWorkflowExecutionId(workflowId: string, executionId: string): void {
  updateWorkflow(workflowId, (workflow) => {
    workflow.executionId = executionId
  })
}
