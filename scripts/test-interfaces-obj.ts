import { getConfig } from '../src/config/index.js'
import { createAiriaClient } from '../src/services/airia-client.js'

async function run() {
  const config = getConfig()
  const client = (createAiriaClient(config) as any)
  
  const modelsPage = await client.request('/v1/Models?PageNumber=1&PageSize=50&skipProjectId=true', { method: 'GET' })
  const modelId = modelsPage.items?.[0]?.id

  const interfacesToTest = [
    [ { id: "chat" } ],
    [ { type: "Chat" } ],
    [ { name: "Chat" } ],
    [ { interfaceId: "chat" } ],
    [ { AgentInterface: "Chat" } ],
    [ { value: "Chat" } ]
  ]

  for (const intf of interfacesToTest) {
    console.log(`\nTesting interfaces: ${JSON.stringify(intf)}`)
    const payload = [
      {
        projectId: config.airiaProjectId ?? '',
        name: `Test Agent`,
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
      } else {
        console.log(`FAILED: ${result[0]?.errorMessage}`)
      }
    } catch (e: any) {
      console.log(`HTTP ERROR: ${e.message.split('\n')[0]}`)
    }
  }
}

run().catch(console.error)
