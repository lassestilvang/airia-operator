import { getConfig } from '../src/config/index.js'
import { createAiriaClient } from '../src/services/airia-client.js'

async function run() {
  const config = getConfig()
  const client = (createAiriaClient(config) as any)
  
  const crmAgentId = '53536f1f-c267-4046-9114-ccc3981dab42'
  
  console.log(`Testing execution for CRM Agent (${crmAgentId})...`)
  
  const formats = [
    { userInput: 'Onboard Acme Corp' },
    { userInput: 'Onboard Acme Corp', input: 'Onboard Acme Corp' },
    { userInput: 'Onboard Acme Corp', prompt: 'Onboard Acme Corp' }
  ]
  
  for (const body of formats) {
    console.log(`\nFormat: ${JSON.stringify(body)}`)
    try {
      const response = await client.request(`/v1/PipelineExecution/${crmAgentId}`, {
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
