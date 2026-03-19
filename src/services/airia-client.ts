import { randomUUID } from 'node:crypto'

import type { AppConfig } from '../types/index.js'

type JsonObject = Record<string, unknown>

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface AiriaToolSpec {
  key: string
  payload: JsonObject
}

export interface AiriaAgentSpec {
  key: string
  name: string
  description: string
  prompt: string
  tools?: string[]
}

export interface AiriaProvisionResult {
  tools: Record<string, string>
  agents: Record<string, string>
  workflow: {
    swarmId: string
    name: string
  }
}

export interface AiriaRunResult {
  executionId: string
}

class AiriaClient {
  constructor(private readonly config: AppConfig) {}

  get canUseRemote(): boolean {
    return Boolean(this.config.airiaApiKey)
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    if (!this.config.airiaApiKey) {
      throw new Error('AIRIA_API_KEY is not set')
    }

    const response = await fetch(`${this.config.airiaApiBaseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.airiaApiKey,
        'x-correlation-id': randomUUID(),
        ...(init?.headers ?? {}),
      },
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(`Airia API Error [${response.status}] ${path}:`, text)
      throw new Error(`Airia API ${path} failed (${response.status}): ${text}`)
    }

    if (response.status === 204) {
      return {} as T
    }

    return (await response.json()) as T
  }

  private async listTools(): Promise<Array<{ id: string; name?: string; standardizedName?: string }>> {
    const projectId = this.config.airiaProjectId ? `&ProjectId=${this.config.airiaProjectId}` : ''
    const page = await this.request<{ items?: Array<{ id: string; name?: string; standardizedName?: string }> }>(
      `/v1/Tools?PageNumber=1&PageSize=200${projectId}`,
      { method: 'GET' },
    )
    return page.items ?? []
  }

  private async upsertTool(spec: AiriaToolSpec): Promise<string> {
    const existing = await this.listTools()
    const found = existing.find((tool) => tool.name?.toLowerCase() === spec.payload.name?.toString().toLowerCase())

    const payload = {
      ...spec.payload,
      projectId: this.config.airiaProjectId,
    }

    if (!found) {
      const created = await this.request<{ id: string }>('/v1/Tools', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      return created.id
    }

    await this.request(`/v1/Tools/${found.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...payload, id: found.id }),
    })
    return found.id
  }

  private async listPipelines(): Promise<Array<{ id: string; name?: string }>> {
    const projectId = this.config.airiaProjectId ? `&ProjectId=${this.config.airiaProjectId}` : ''
    const page = await this.request<{ items?: Array<{ id: string; name?: string }> }>(
      `/v1/PipelinesConfig?PageNumber=1&PageSize=200${projectId}`,
      { method: 'GET' },
    )
    return page.items ?? []
  }

  private async createAssistantFromSpec(spec: AiriaAgentSpec, tools: Record<string, { id: string; name: string; description: string }>): Promise<string> {
    const modelsPage = await this.request<{ items?: Array<{ id: string }> }>('/v1/Models?PageNumber=1&PageSize=1', {
      method: 'GET',
    })
    const modelId = modelsPage.items?.[0]?.id

    if (!modelId) {
      throw new Error('No models available to create assistant')
    }

    const skills = (spec.tools ?? [])
      .map((toolKey) => tools[toolKey])
      .filter(Boolean)
      .map((t) => ({ 
        id: t.id,
        name: t.name,
        description: t.description
      }))

    const payload = [
      {
        projectId: this.config.airiaProjectId ?? '',
        name: spec.name,
        description: spec.description,
        instructions: spec.prompt,
        modelId,
        version: '1.0.0',
        skills,
        modalities: ['text'],
        defaultInputModes: ['text'],
        defaultOutputModes: ['text'],
      },
    ]

    const result = await this.request<Array<{ success: boolean; createdAgentId: string; errorMessage?: string }>>(
      '/v1/AgentCard',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    )

    const first = result[0]
    if (!first?.success) {
      throw new Error(`Failed to create agent card: ${first?.errorMessage ?? 'Unknown error'}`)
    }

    return first.createdAgentId
  }

  private async upsertAgent(spec: AiriaAgentSpec, tools: Record<string, { id: string; name: string; description: string }>): Promise<string> {
    const pipelines = await this.listPipelines()
    const existing = pipelines.find((pipeline) => pipeline.name === spec.name)

    if (!existing) {
      return this.createAssistantFromSpec(spec, tools)
    }

    // Fetch existing detail to preserve steps and other config
    const detail = await this.request<{ activeVersion?: { steps: any[]; alignment: string } }>(
      `/v1/PipelinesConfig/${existing.id}`,
      { method: 'GET' },
    )

    const modelsPage = await this.request<{ items?: Array<{ id: string }> }>('/v1/Models?PageNumber=1&PageSize=1', {
      method: 'GET',
    })
    const modelId = modelsPage.items?.[0]?.id

    const skills = (spec.tools ?? [])
      .map((toolKey) => tools[toolKey])
      .filter(Boolean)
      .map((t) => ({ 
        id: t.id,
        name: t.name,
        description: t.description
      }))

    await this.request(`/v1/PipelinesConfig/${existing.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        id: existing.id,
        name: spec.name,
        description: spec.description,
        instructions: spec.prompt,
        modelId,
        projectId: this.config.airiaProjectId,
        skills,
        steps: detail.activeVersion?.steps ?? [],
        alignment: detail.activeVersion?.alignment ?? 'Vertical',
      }),
    })
    return existing.id
  }

  private async listSwarms(): Promise<Array<{ id: string; name: string; members?: Array<{ pipelineId: string }> }>> {
    const projectId = this.config.airiaProjectId ? `&ProjectId=${this.config.airiaProjectId}` : ''
    const response = await this.request<Array<{ id: string; name: string; members?: Array<{ pipelineId: string }> }>>(
      `/v1/AgentSwarms?PageNumber=1&PageSize=200${projectId}`,
      { method: 'GET' },
    )
    return response ?? []
  }

  private async ensureSwarmMembership(swarmId: string, pipelineIds: string[]): Promise<void> {
    const swarms = await this.listSwarms()
    const swarm = swarms.find((value) => value.id === swarmId)
    const existingIds = new Set((swarm?.members ?? []).map((member) => member.pipelineId))

    for (const pipelineId of pipelineIds) {
      if (existingIds.has(pipelineId)) continue

      await this.request(`/v1/AgentSwarms/${swarmId}/members`, {
        method: 'POST',
        body: JSON.stringify({ pipelineId }),
      })
    }
  }

  private async upsertWorkflowSwarm(name: string, pipelineIds: string[]): Promise<{ swarmId: string; name: string }> {
    const swarms = await this.listSwarms()
    const existing = swarms.find((swarm) => swarm.name === name)

    if (!existing) {
      const created = await this.request<{ id: string; name: string }>('/v1/AgentSwarms', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description: 'Hackathon onboarding orchestration swarm',
          projectId: this.config.airiaProjectId,
        }),
      })

      await this.ensureSwarmMembership(created.id, pipelineIds)
      return { swarmId: created.id, name: created.name }
    }

    await this.request(`/v1/AgentSwarms/${existing.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        id: existing.id,
        name: name,
        description: 'Hackathon onboarding orchestration swarm',
        projectId: this.config.airiaProjectId,
      }),
    })

    await this.ensureSwarmMembership(existing.id, pipelineIds)
    return { swarmId: existing.id, name: existing.name }
  }

  private async cleanupAll(): Promise<void> {
    const projectId = this.config.airiaProjectId ? `&ProjectId=${this.config.airiaProjectId}` : ''
    
    // 1. Delete Swarms
    const swarms = await this.listSwarms()
    for (const swarm of swarms) {
      if (swarm.name === 'enterprise_customer_onboarding') {
        await this.request(`/v1/AgentSwarms/${swarm.id}`, { method: 'DELETE' }).catch(() => {})
      }
    }

    // 2. Delete Pipelines
    const pipelines = await this.listPipelines()
    const names = ['CRM Agent', 'Docs Agent', 'Ops Agent', 'Comms Agent', 'Governance Agent', 'Test Agent']
    for (const pipeline of pipelines) {
      if (names.includes(pipeline.name ?? '')) {
        await this.request(`/v1/PipelinesConfig/${pipeline.id}`, { method: 'DELETE' }).catch(() => {})
      }
    }

    // 3. Delete Agent Cards
    try {
      const cards = await this.request<Array<{ agentCardId: string; name: string }>>(`/v1/AgentCard?PageNumber=1&PageSize=200${projectId}`, { method: 'GET' })
      for (const card of cards) {
        if (names.includes(card.name)) {
          await this.request(`/v1/AgentCard/${card.agentCardId}`, { method: 'DELETE' }).catch(() => {})
        }
      }
    } catch (e) {
      // Endpoint might not exist or list differently
    }

    // 4. Delete Tools
    const tools = await this.listTools()
    const toolNames = ['mock-crm', 'mock-tasks', 'send-email', 'send-slack']
    for (const tool of tools) {
      if (toolNames.includes(tool.name ?? '')) {
        await this.request(`/v1/Tools/${tool.id}`, { method: 'DELETE' }).catch(() => {})
      }
    }
  }

  async provision(args: { tools: AiriaToolSpec[]; agents: AiriaAgentSpec[]; workflowName: string }): Promise<AiriaProvisionResult> {
    console.log('Performing deep cleanup of Airia resources...')
    // Try cleanup a few times to ensure everything is gone
    await this.cleanupAll().catch(() => {})
    await sleep(1000)
    await this.cleanupAll().catch(() => {})

    console.log('Provisioning new Airia resources...')
    const toolEntries = await Promise.all(
      args.tools.map(async (tool) => {
        const payload = {
          ...tool.payload,
          projectId: this.config.airiaProjectId,
          routeThroughACC: false, // Ensure direct access via tunnel
        }
        const created = await this.request<{ id: string }>('/v1/Tools', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        return [tool.key, { 
          id: created.id, 
          name: tool.payload.name as string, 
          description: tool.payload.description as string 
        }] as const
      }),
    )
    const tools = Object.fromEntries(toolEntries)

    const agentEntries = await Promise.all(
      args.agents.map(async (agent) => {
        // Always create a new assistant (Agent Card + Pipeline)
        const id = await this.createAssistantFromSpec(agent, tools)
        return [agent.key, id] as const
      }),
    )
    const agents = Object.fromEntries(agentEntries)

    const workflow = await this.upsertWorkflowSwarm(args.workflowName, Object.values(agents))
    return { tools: Object.fromEntries(Object.entries(tools).map(([k, v]) => [k, v.id])), agents, workflow }
  }

  async runPipeline(pipelineId: string, goal: string): Promise<AiriaRunResult> {
    const run = await this.request<{ executionId: string }>(`/v1/PipelineExecution/${pipelineId}`, {
      method: 'POST',
      body: JSON.stringify({
        userInput: goal,
        asyncOutput: true,
        includeToolsResponse: true,
        saveHistory: true,
      }),
    })

    const executionId = run.executionId

    // Poll for completion
    let attempts = 0
    const maxAttempts = 30
    while (attempts < maxAttempts) {
      const report = await this.request<{ status: string }>(`/v1/PipelineExecution/${executionId}`, {
        method: 'GET',
      })

      if (report.status === 'Completed') {
        return { executionId }
      }

      if (report.status === 'Failed') {
        throw new Error(`Pipeline execution ${executionId} failed`)
      }

      await sleep(2000)
      attempts++
    }

    return { executionId }
  }
}

export function createAiriaClient(config: AppConfig): AiriaClient {
  return new AiriaClient(config)
}
