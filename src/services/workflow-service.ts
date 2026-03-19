import type { AppConfig, ApprovalDecision, CustomerProfile, OnboardingTask, WorkflowResponse } from '../types/index.js'
import {
  addToolLog,
  addWorkflowEvent,
  completeWorkflow,
  createWorkflow,
  failWorkflow,
  findCustomerProfile,
  getWorkflow,
  getWorkflows,
  rejectWorkflow,
  setWorkflowApprovalState,
  setWorkflowCommsState,
  setWorkflowCustomerProfile,
  setWorkflowDocMarkdown,
  setWorkflowExecutionId,
  setWorkflowTasks,
} from '../state/store.js'
import { eventBus } from './event-bus.js'
import { createAiriaClient } from './airia-client.js'
import { loadAiriaState } from './airia-state.js'

const STEP_DELAY_MS = 300

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function extractCompanyName(goal: string): string {
  const match = goal.match(/onboard\s+(.+?)(?:\s*\(|$)/i)
  if (!match?.[1]) {
    return 'Acme Corp'
  }
  return match[1].trim()
}

function buildDocMarkdown(profile: CustomerProfile): string {
  return [
    `# ${profile.company_name} Onboarding Guide`,
    '',
    `Welcome to Airia, ${profile.company_name}.`,
    '',
    '## Setup Steps',
    '',
    `1. Confirm ${profile.plan} plan provisioning for ${profile.seats} seats.`,
    '2. Validate SSO and identity provider setup.',
    '3. Schedule admin enablement session.',
    '',
    '## Assigned Responsibilities',
    '',
    '- Customer IT Admin: complete SSO setup.',
    '- Airia CSM: deliver enablement walkthrough.',
    '- Airia Support: monitor first-week adoption.',
  ].join('\n')
}

function buildOpsTasks(profile: CustomerProfile): OnboardingTask[] {
  return [
    {
      title: `Create ${profile.company_name} workspace`,
      owner: 'Sales Ops',
      status: 'created',
    },
    {
      title: `Assign ${profile.seats} ${profile.plan} seats`,
      owner: 'Platform Ops',
      status: 'created',
    },
    {
      title: `Book onboarding kickoff call`,
      owner: 'Customer Success',
      status: 'created',
    },
  ]
}

function toWorkflowResponseFromState(workflow: {
  id: string
  goal: string
  status: WorkflowResponse['status']
  awaitingApproval: boolean
  summary?: WorkflowResponse['summary']
  rejectedReason?: string
  error?: string
  events: WorkflowResponse['events']
}): WorkflowResponse {
  return {
    id: workflow.id,
    goal: workflow.goal,
    status: workflow.status,
    awaitingApproval: workflow.awaitingApproval,
    summary: workflow.summary,
    rejectedReason: workflow.rejectedReason,
    error: workflow.error,
    events: workflow.events,
  }
}

function toWorkflowResponse(workflowId: string): WorkflowResponse {
  const workflow = getWorkflow(workflowId)
  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`)
  }
  return toWorkflowResponseFromState(workflow)
}

export class WorkflowService {
  constructor(private readonly config: AppConfig) {}

  private emit(workflowId: string, payload: Parameters<typeof addWorkflowEvent>[1]): void {
    const event = addWorkflowEvent(workflowId, payload)
    eventBus.publish(event)
  }

  async run(goal: string): Promise<{ workflowId: string }> {
    const workflow = createWorkflow(goal)

    this.emit(workflow.id, {
      stepId: 'plan',
      agent: 'planner',
      status: 'running',
      message: 'Planner started goal interpretation',
      data: { goal },
    })

    await sleep(STEP_DELAY_MS)

    const companyName = extractCompanyName(goal)

    this.emit(workflow.id, {
      stepId: 'plan',
      agent: 'planner',
      status: 'completed',
      message: `Planner extracted company: ${companyName}`,
      data: { companyName },
    })

    void this.execute(workflow.id, companyName).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown workflow error'
      failWorkflow(workflow.id, message)
      this.emit(workflow.id, {
        stepId: 'finalize',
        agent: 'system',
        status: 'failed',
        message,
      })
    })

    return { workflowId: workflow.id }
  }

  private async execute(workflowId: string, companyName: string): Promise<void> {
    const airiaClient = createAiriaClient(this.config)
    const state = await loadAiriaState()

    this.emit(workflowId, {
      stepId: 'crm_fetch',
      agent: 'crm',
      status: 'running',
      message: `CRM Agent fetching profile for ${companyName}`,
    })
    await sleep(STEP_DELAY_MS)

    const profile = findCustomerProfile(companyName)
    if (!profile) {
      failWorkflow(workflowId, `Customer profile not found for ${companyName}`)
      this.emit(workflowId, {
        stepId: 'crm_fetch',
        agent: 'crm',
        status: 'failed',
        message: `CRM profile not found for ${companyName}`,
      })
      return
    }

    addToolLog('crm', { companyName, profile })
    setWorkflowCustomerProfile(workflowId, profile)

    this.emit(workflowId, {
      stepId: 'crm_fetch',
      agent: 'crm',
      status: 'completed',
      message: 'CRM Agent fetched customer data',
      data: profile as unknown as Record<string, unknown>,
    })

    this.emit(workflowId, {
      stepId: 'docs_generate',
      agent: 'docs',
      status: 'running',
      message: 'Docs Agent generating onboarding markdown',
    })
    await sleep(STEP_DELAY_MS)

    const docMarkdown = buildDocMarkdown(profile)
    setWorkflowDocMarkdown(workflowId, docMarkdown)

    this.emit(workflowId, {
      stepId: 'docs_generate',
      agent: 'docs',
      status: 'completed',
      message: 'Docs Agent generated onboarding guide',
      data: { preview: docMarkdown.slice(0, 160) },
    })

    this.emit(workflowId, {
      stepId: 'ops_create',
      agent: 'ops',
      status: 'running',
      message: 'Ops Agent creating onboarding tasks',
    })
    await sleep(STEP_DELAY_MS)

    const tasks = buildOpsTasks(profile)
    addToolLog('tasks', { companyName: profile.company_name, tasks })
    setWorkflowTasks(workflowId, tasks)

    this.emit(workflowId, {
      stepId: 'ops_create',
      agent: 'ops',
      status: 'completed',
      message: `Ops Agent created ${tasks.length} tasks`,
      data: { tasksCount: tasks.length },
    })

    this.emit(workflowId, {
      stepId: 'governance_check',
      agent: 'governance',
      status: 'running',
      message: 'Governance Agent validating external email action',
    })
    await sleep(STEP_DELAY_MS)

    setWorkflowApprovalState(workflowId, true)

    this.emit(workflowId, {
      stepId: 'governance_check',
      agent: 'governance',
      status: 'paused_approval',
      message: `Approval required to email ${profile.contact_email}`,
      data: {
        reason: 'External email requires human approval',
        company: profile.company_name,
        contact_email: profile.contact_email,
      },
    })

    if (airiaClient.canUseRemote && state.agents.crm) {
      try {
        const run = await airiaClient.runPipeline(state.agents.crm, `Fetch onboarding profile for ${profile.company_name}`)
        setWorkflowExecutionId(workflowId, run.executionId)
      } catch {
        // Best-effort Airia execution hook for hackathon demo.
      }
    }
  }

  approve(workflowId: string, decision: ApprovalDecision): WorkflowResponse {
    const workflow = getWorkflow(workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }

    if (!workflow.awaitingApproval) {
      throw new Error(`Workflow ${workflowId} is not awaiting approval`)
    }

    if (decision === 'reject') {
      rejectWorkflow(workflowId, 'Human rejected external communication')
      this.emit(workflowId, {
        stepId: 'governance_check',
        agent: 'governance',
        status: 'rejected',
        message: 'Approval rejected by human reviewer',
      })
      return toWorkflowResponse(workflowId)
    }

    setWorkflowApprovalState(workflowId, false)
    this.emit(workflowId, {
      stepId: 'governance_check',
      agent: 'governance',
      status: 'completed',
      message: 'Approval granted by human reviewer',
    })

    const profile = workflow.customerProfile
    if (!profile || !workflow.docMarkdown) {
      failWorkflow(workflowId, 'Missing workflow context before comms step')
      this.emit(workflowId, {
        stepId: 'comms_send',
        agent: 'comms',
        status: 'failed',
        message: 'Workflow context missing before communications',
      })
      return toWorkflowResponse(workflowId)
    }

    this.emit(workflowId, {
      stepId: 'comms_send',
      agent: 'comms',
      status: 'running',
      message: 'Comms Agent sending email + slack notification',
    })

    addToolLog('email', {
      to: profile.contact_email,
      subject: `${profile.company_name} onboarding guide`,
      bodyPreview: workflow.docMarkdown.slice(0, 300),
    })
    addToolLog('slack', {
      channel: '#onboarding',
      message: `Onboarding started for ${profile.company_name} (${profile.seats} seats)`,
    })

    setWorkflowCommsState(workflowId, { emailSent: true, slackSent: true })

    this.emit(workflowId, {
      stepId: 'comms_send',
      agent: 'comms',
      status: 'completed',
      message: 'Comms Agent sent email and slack notification',
      data: {
        email_sent: true,
        slack_sent: true,
      },
    })

    completeWorkflow(workflowId)
    this.emit(workflowId, {
      stepId: 'finalize',
      agent: 'system',
      status: 'completed',
      message: 'Workflow completed successfully',
      data: {
        tasks_created: workflow.tasks.length,
        email_sent: true,
        slack_sent: true,
      },
    })

    return toWorkflowResponse(workflowId)
  }

  get(workflowId: string): WorkflowResponse {
    return toWorkflowResponse(workflowId)
  }

  list(): WorkflowResponse[] {
    return getWorkflows().map((workflow) => toWorkflowResponseFromState(workflow))
  }
}

export function createWorkflowService(config: AppConfig): WorkflowService {
  return new WorkflowService(config)
}
