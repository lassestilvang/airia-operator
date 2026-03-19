import { getConfig } from '../src/config/index.js'
import { createAiriaClient } from '../src/services/airia-client.js'

async function run() {
  const config = getConfig()
  const client = (createAiriaClient(config) as any)
  
  const pipelines = await client.request('/v1/PipelinesConfig?PageNumber=1&PageSize=200', { method: 'GET' })
  const crmAgent = pipelines.items.find((p: any) => p.name === 'CRM Agent')
  
  if (!crmAgent) {
    console.log('CRM Agent not found')
    return
  }
  
  console.log(`Testing execution for CRM Agent (${crmAgent.id})...`)
  
  const formats = [
    { userInput: 'Onboard Acme Corp' },
    { input: 'Onboard Acme Corp' },
    { userInput: 'Onboard Acme Corp', asyncOutput: false },
    { input: 'Onboard Acme Corp', asyncOutput: false }
  ]
  
  for (const body of formats) {
    console.log(`\nFormat: ${JSON.stringify(body)}`)
    try {
      const response = await client.request(`/v1/PipelineExecution/${crmAgent.id}`, {
        method: 'POST',
        body: JSON.stringify({
          ...body,
          includeToolsResponse: true,
          saveHistory: true
        })
      })
      console.log('SUCCESS:', JSON.stringify(response, null, 2))
    } catch (e: any) {
      console.log('FAILED')
    }
  }
}

run().catch(console.error)
