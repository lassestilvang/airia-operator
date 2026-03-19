export type ApprovalDecision = 'approve' | 'reject'

export type WorkflowStatus =
  | 'queued'
  | 'running'
  | 'paused_approval'
  | 'completed'
  | 'rejected'
  | 'failed'

export type WorkflowStepId =
  | 'plan'
  | 'crm_fetch'
  | 'docs_generate'
  | 'ops_create'
  | 'governance_check'
  | 'comms_send'
  | 'finalize'

export type AgentName =
  | 'planner'
  | 'crm'
  | 'docs'
  | 'ops'
  | 'governance'
  | 'comms'
  | 'system'

export interface WorkflowEvent {
  id: string
  workflowId: string
  timestamp: string
  stepId: WorkflowStepId
  agent: AgentName
  status: WorkflowStatus
  message: string
  data?: Record<string, unknown>
}

export interface CustomerProfile {
  company_name: string
  plan: string
  seats: number
  contact_email: string
  status: string
}

export interface OnboardingTask {
  title: string
  owner: string
  status: 'created'
}

export interface WorkflowSummary {
  tasks_created: number
  email_sent: boolean
  slack_sent: boolean
}

export interface WorkflowState {
  id: string
  goal: string
  status: WorkflowStatus
  createdAt: string
  updatedAt: string
  customerProfile?: CustomerProfile
  docMarkdown?: string
  tasks: OnboardingTask[]
  emailSent: boolean
  slackSent: boolean
  awaitingApproval: boolean
  rejectedReason?: string
  error?: string
  summary?: WorkflowSummary
  events: WorkflowEvent[]
  executionId?: string
}

export interface RunWorkflowRequest {
  goal: string
}

export interface RunWorkflowResponse {
  workflow_id: string
  status: WorkflowStatus
}

export interface ApproveWorkflowRequest {
  workflow_id: string
  decision: ApprovalDecision
}

export interface WorkflowResponse {
  id: string
  goal: string
  status: WorkflowStatus
  awaitingApproval: boolean
  summary?: WorkflowSummary
  rejectedReason?: string
  error?: string
  events: WorkflowEvent[]
}

export interface ToolCallLog {
  id: string
  type: 'crm' | 'tasks' | 'email' | 'slack'
  timestamp: string
  payload: Record<string, unknown>
}

export interface AiriaProvisionState {
  tools: Record<string, string>
  agents: Record<string, string>
  workflow?: {
    swarmId: string
    name: string
  }
}

export interface AppConfig {
  port: number
  approvalMode: 'manual'
  airiaApiBaseUrl: string
  airiaApiKey?: string
  airiaProjectId?: string
  appBaseUrl: string
  useAiria: boolean
}
