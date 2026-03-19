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

    let cleanPath = path
    let skipProjectId = false
    if (path.includes('skipProjectId=true')) {
      skipProjectId = true
      cleanPath = path.replace(/[?&]skipProjectId=true/, (match) => {
        return match.startsWith('?') ? '?' : ''
      }).replace(/\?$/, '')
    }

    const separator = cleanPath.includes('?') ? '&' : '?'
    const hasProjectId = cleanPath.includes('ProjectId=')
    const projectIdParam = (this.config.airiaProjectId && !hasProjectId && !skipProjectId) ? `${separator}ProjectId=${this.config.airiaProjectId}` : ''
    const url = `${this.config.airiaApiBaseUrl}${cleanPath}${projectIdParam}`

    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.airiaApiKey,
        'x-correlation-id': randomUUID(),
        ...(this.config.airiaProjectId ? { 'ProjectId': this.config.airiaProjectId } : {}),
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

  private async listTools(): Promise<Array<{ id: string; name?: string; standardizedName?: string; description?: string }>> {
    const page = await this.request<{ items?: Array<{ id: string; name?: string; standardizedName?: string; description?: string }> }>(
      '/v1/Tools?PageNumber=1&PageSize=200',
      { method: 'GET' },
    )
    return page.items ?? []
  }

  private async listPipelines(): Promise<Array<{ id: string; name?: string }>> {
    const page = await this.request<{ items?: Array<{ id: string; name?: string }> }>(
      '/v1/PipelinesConfig?PageNumber=1&PageSize=200',
      { method: 'GET' },
    )
    return page.items ?? []
  }

  private async createAssistantFromSpec(spec: AiriaAgentSpec, tools: Record<string, { id: string; name: string; description: string }>): Promise<string> {
    const modelsPage = await this.request<{ items?: Array<{ id: string }> }>('/v1/Models?PageNumber=1&PageSize=50&skipProjectId=true', {
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
        Id: t.id,
        Name: t.name,
        Description: t.description
      }))

    console.log(`Creating Agent Card for ${spec.name}...`)
    
    const cardPayload = [
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
        supportedInterfaces: [
          {
            Url: "https://api.airia.ai",
            ProtocolBinding: "Chat",
            ProtocolVersion: "1.0"
          }
        ]
      },
    ]

    const cardResult = await this.request<Array<{ success: boolean; createdAgentId: string; errorMessage?: string }>>(
      '/v1/AgentCard',
      {
        method: 'POST',
        body: JSON.stringify(cardPayload),
      },
    )

    if (!cardResult[0]?.success) {
      throw new Error(`Failed to create agent card: ${cardResult[0]?.errorMessage}`)
    }

    const agentCardId = cardResult[0].createdAgentId

    await sleep(2000)
    const pipelines = await this.listPipelines()
    const autoPipeline = pipelines.find(p => p.name === spec.name)
    
    if (autoPipeline) {
        console.log(`Found linked Pipeline for ${spec.name}: ${autoPipeline.id}`)
        return autoPipeline.id
    }

    console.warn(`Could not find auto-generated pipeline for ${spec.name}, returning Agent Card ID.`)
    return agentCardId
  }

  private async listSwarms(): Promise<Array<{ id: string; name: string; members?: Array<{ pipelineId: string }> }>> {
    try {
      const response = await this.request<Array<{ id: string; name: string; members?: Array<{ pipelineId: string }> }>>(
        '/v1/AgentSwarms?PageNumber=1&PageSize=200',
        { method: 'GET' },
      )
      return response ?? []
    } catch {
      return []
    }
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
    const names = ['CRM Agent', 'Docs Agent', 'Ops Agent', 'Comms Agent', 'Governance Agent', 'Test Agent']

    // 1. Delete Swarms
    try {
      const swarms = await this.listSwarms()
      for (const swarm of swarms) {
        if (swarm.name === 'enterprise_customer_onboarding') {
          await this.request(`/v1/AgentSwarms/${swarm.id}`, { method: 'DELETE' }).catch(() => {})
        }
      }
    } catch {}

    // 2. Delete Pipelines
    try {
      const pipelines = await this.listPipelines()
      for (const pipeline of pipelines) {
        if (names.includes(pipeline.name ?? '')) {
          await this.request(`/v1/PipelinesConfig/${pipeline.id}`, { method: 'DELETE' }).catch(() => {})
        }
      }
    } catch {}

    // 3. Delete Agent Cards
    try {
      const cardsPage = await this.request<{ items?: Array<{ agentCardId: string; name: string }> }>('/v1/AgentCard?PageNumber=1&PageSize=200', { method: 'GET' })
      const cards = cardsPage.items ?? []
      for (const card of cards) {
        if (names.includes(card.name)) {
          await this.request(`/v1/AgentCard/${card.agentCardId}`, { method: 'DELETE' }).catch(() => {})
        }
      }
    } catch {}

    // 4. Delete Tools
    try {
      const tools = await this.listTools()
      const toolNames = ['mock-crm', 'mock-tasks', 'send-email', 'send-slack']
      for (const tool of tools) {
        if (toolNames.includes(tool.name ?? '')) {
          await this.request(`/v1/Tools/${tool.id}`, { method: 'DELETE' }).catch(() => {})
        }
      }
    } catch {}
  }

  async provision(args: { tools: AiriaToolSpec[]; agents: AiriaAgentSpec[]; workflowName: string }): Promise<AiriaProvisionResult> {
    console.log('Performing deep cleanup of Airia resources...')
    await this.cleanupAll().catch(() => {})
    await sleep(1000)
    await this.cleanupAll().catch(() => {})

    console.log('Provisioning new Airia resources...')
    const toolEntries = await Promise.all(
      args.tools.map(async (tool) => {
        const payload = {
          ...tool.payload,
          projectId: this.config.airiaProjectId,
          routeThroughACC: false,
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
        const id = await this.createAssistantFromSpec(agent, tools)
        return [agent.key, id] as const
      }),
    )
    const agents = Object.fromEntries(agentEntries)

    const workflow = await this.upsertWorkflowSwarm(args.workflowName, Object.values(agents))
    return { tools: Object.fromEntries(Object.entries(tools).map(([k, v]) => [k, v.id])), agents, workflow }
  }

  async runPipeline(pipelineId: string, goal: string): Promise<AiriaRunResult> {
    const response = await this.request<any>(`/v1/PipelineExecution/${pipelineId}`, {
      method: 'POST',
      body: JSON.stringify({
        userInput: goal,
        asyncOutput: false,
        includeToolsResponse: true,
        saveHistory: false,
      }),
    })

    return {
      executionId: response.executionId ?? response.id ?? randomUUID(),
    }
  }
}

export function createAiriaClient(config: AppConfig): AiriaClient {
  return new AiriaClient(config)
}
