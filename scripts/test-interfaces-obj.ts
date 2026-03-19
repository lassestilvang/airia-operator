import { getConfig } from '../src/config/index.js'
import { createAiriaClient } from '../src/services/airia-client.js'

async function run() {
  const config = getConfig()
  const client = (createAiriaClient(config) as any)
  
  const modelsPage = await client.request('/v1/Models?PageNumber=1&PageSize=50&skipProjectId=true', { method: 'GET' })
  const modelId = modelsPage.items?.[0]?.id

  const interfacesToTest = [
    [ { Url: "https://api.airia.ai", ProtocolBinding: "Chat", ProtocolVersion: "1.0" } ],
    [ { Url: "http://localhost:3000", ProtocolBinding: "http", ProtocolVersion: "1.1" } ]
  ]

  for (const intf of interfacesToTest) {
    console.log(`\nTesting interfaces: ${JSON.stringify(intf)}`)
    const payload = [
      {
        projectId: config.airiaProjectId ?? '',
        name: `Test Agent ${Date.now()}`,
        description: 'Test',
        instructions: 'Test',
        modelId,
        version: '1.0.0',
        skills: [],
        modalities: ['text'],
        defaultInputModes: ['text'],
        defaultOutputModes: ['text'],
        userAgent: 'AiriaAutoOperator/1.0',
        supportedInterfaces: intf,
      },
    ]

    try {
      const result = await client.request('/v1/AgentCard', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      if (result[0]?.success) {
        console.log(`SUCCESS! AgentCardId: ${result[0].createdAgentId}`)
        
        // Let's test pipeline execution!
        await new Promise(r => setTimeout(r, 2000))
        const pipelines = await client.request('/v1/PipelinesConfig?PageNumber=1&PageSize=200', { method: 'GET' })
        const p = pipelines.items.find((x: any) => x.name === payload[0].name)
        if (p) {
            console.log(`Executing pipeline ${p.id}...`)
            try {
                const execRes = await client.request(`/v1/PipelineExecution/${p.id}`, {
                    method: 'POST',
                    body: JSON.stringify({ userInput: 'Test', saveHistory: true, includeToolsResponse: true })
                })
                console.log('EXECUTION SUCCESS:', execRes)
            } catch (execErr: any) {
                console.log('EXECUTION FAILED:', execErr.message.split('\n')[0])
            }
        }
      } else {
        console.log(`FAILED: ${result[0]?.errorMessage}`)
      }
    } catch (e: any) {
      console.log(`HTTP ERROR: ${e.message.split('\n')[0]}`)
    }
  }
}

run().catch(console.error)
