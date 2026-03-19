import { randomUUID } from 'node:crypto'

import type { AppConfig } from '../types/index.js'

type JsonObject = Record<string, unknown>

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

  private async createAssistantFromSpec(spec: AiriaAgentSpec, toolIds: Record<string, string>): Promise<string> {
    const modelsPage = await this.request<{ items?: Array<{ id: string }> }>('/v1/Models?PageNumber=1&PageSize=1', {
      method: 'GET',
    })
    const modelId = modelsPage.items?.[0]?.id

    if (!modelId) {
      throw new Error('No models available to create assistant')
    }

    const skills = (spec.tools ?? [])
      .map((toolKey) => toolIds[toolKey])
      .filter(Boolean)
      .map((skillId) => ({ skillId }))

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

  private async upsertAgent(spec: AiriaAgentSpec, toolIds: Record<string, string>): Promise<string> {
    const pipelines = await this.listPipelines()
    const existing = pipelines.find((pipeline) => pipeline.name === spec.name)

    if (!existing) {
      return this.createAssistantFromSpec(spec, toolIds)
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
      .map((toolKey) => toolIds[toolKey])
      .filter(Boolean)
      .map((skillId) => ({ skillId }))

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

  async provision(args: { tools: AiriaToolSpec[]; agents: AiriaAgentSpec[]; workflowName: string }): Promise<AiriaProvisionResult> {
    const toolEntries = await Promise.all(
      args.tools.map(async (tool) => {
        const id = await this.upsertTool(tool)
        return [tool.key, id] as const
      }),
    )
    const tools = Object.fromEntries(toolEntries)

    const agentEntries = await Promise.all(
      args.agents.map(async (agent) => {
        const id = await this.upsertAgent(agent, tools)
        return [agent.key, id] as const
      }),
    )
    const agents = Object.fromEntries(agentEntries)

    const workflow = await this.upsertWorkflowSwarm(args.workflowName, Object.values(agents))
    return { tools, agents, workflow }
  }

  async runPipeline(pipelineId: string, goal: string): Promise<AiriaRunResult> {
    const result = await this.request<{ executionId?: string }>(`/v1/PipelineExecution/${pipelineId}`, {
      method: 'POST',
      body: JSON.stringify({
        userInput: goal,
        asyncOutput: false,
        includeToolsResponse: true,
        saveHistory: false,
      }),
    })

    return {
      executionId: result.executionId ?? randomUUID(),
    }
  }
}

export function createAiriaClient(config: AppConfig): AiriaClient {
  return new AiriaClient(config)
}
