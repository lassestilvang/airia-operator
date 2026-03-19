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
    const page = await this.request<{ items?: Array<{ id: string; name?: string; standardizedName?: string }> }>(
      '/v1/Tools?PageNumber=1&PageSize=200',
      { method: 'GET' },
    )
    return page.items ?? []
  }

  private async upsertTool(spec: AiriaToolSpec): Promise<string> {
    const existing = await this.listTools()
    const found = existing.find((tool) => tool.name?.toLowerCase() === spec.payload.name?.toString().toLowerCase())

    if (!found) {
      const created = await this.request<{ id: string }>('/v1/Tools', {
        method: 'POST',
        body: JSON.stringify(spec.payload),
      })
      return created.id
    }

    await this.request(`/v1/Tools/${found.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...spec.payload, id: found.id }),
    })
    return found.id
  }

  private async listPipelines(): Promise<Array<{ id: string; name?: string }>> {
    const page = await this.request<{ items?: Array<{ id: string; name?: string }> }>(
      '/v1/PipelinesConfig?PageNumber=1&PageSize=200',
      { method: 'GET' },
    )
    return page.items ?? []
  }

  private async createAssistantFromSpec(spec: AiriaAgentSpec): Promise<string> {
    const payload: JsonObject = {
      name: spec.name,
      description: spec.description,
      promptParameters: {
        prompt: spec.prompt,
      },
      deploymentParameters: {
        deployToChat: false,
      },
      modelParameters: {
        modelIdentifierType: 'None',
      },
      dataStoreParameters: {
        useDataStore: false,
      },
    }

    await this.request('/v1/Assistants', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const pipelines = await this.listPipelines()
    const match = pipelines.find((pipeline) => pipeline.name === spec.name)
    if (!match) {
      throw new Error(`Assistant ${spec.name} was created but pipeline id could not be resolved`)
    }
    return match.id
  }

  private async upsertAgent(spec: AiriaAgentSpec): Promise<string> {
    const pipelines = await this.listPipelines()
    const existing = pipelines.find((pipeline) => pipeline.name === spec.name)

    if (!existing) {
      return this.createAssistantFromSpec(spec)
    }

    await this.request(`/v1/PipelinesConfig/${existing.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        id: existing.id,
        name: spec.name,
        description: spec.description,
      }),
    })
    return existing.id
  }

  private async listSwarms(): Promise<Array<{ id: string; name: string; members?: Array<{ pipelineId: string }> }>> {
    const page = await this.request<{ items?: Array<{ id: string; name: string; members?: Array<{ pipelineId: string }> }> }>(
      '/v1/AgentSwarms?PageNumber=1&PageSize=200',
      { method: 'GET' },
    )
    return page.items ?? []
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
        }),
      })

      await this.ensureSwarmMembership(created.id, pipelineIds)
      return { swarmId: created.id, name: created.name }
    }

    await this.request(`/v1/AgentSwarms/${existing.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name,
        description: 'Hackathon onboarding orchestration swarm',
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
        const id = await this.upsertAgent(agent)
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
