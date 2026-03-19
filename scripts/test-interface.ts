import { getConfig } from '../src/config/index.js'
import { createAiriaClient } from '../src/services/airia-client.js'

async function run() {
  const config = getConfig()
  const client = (createAiriaClient(config) as any)
  
  const testPipelineId = 'dc4e7f88-76a6-4b9a-9934-4a22701d797e'
  
  // Try to get the latest execution for this pipeline
  try {
    const executions = await client.request(`/v1/PipelineExecution/Pipeline/${testPipelineId}?PageNumber=1&PageSize=1`, { method: 'GET' })
    if (executions.items && executions.items.length > 0) {
      const latest = executions.items[0]
      console.log(`Latest Execution ID: ${latest.id} (Status: ${latest.status})`)
      
      // Fetch the full report
      const report = await client.request(`/v1/PipelineExecution/${latest.id}`, { method: 'GET' })
      console.log('Full Report Details:')
      console.log(JSON.stringify(report, null, 2))
    } else {
        console.log('No execution history found.')
    }
  } catch (e: any) {
    console.log(`Failed to fetch execution history: ${e.message}`)
  }
}

run().catch(console.error)
