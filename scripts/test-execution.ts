import { getConfig } from '../src/config/index.js'
import { createAiriaClient } from '../src/services/airia-client.js'

async function run() {
  const config = getConfig()
  const client = (createAiriaClient(config) as any)
  
  const executionId = 'ebea2702-74f9-442e-b77d-d7041d8454c5' // from your last run
  
  console.log(`Fetching report for ${executionId}...`)
  try {
    const report = await client.request(`/v1/PipelineExecution/${executionId}`, { method: 'GET' })
    console.log(JSON.stringify(report, null, 2))
  } catch (e: any) {
    console.log(`Failed to fetch report: ${e.message}`)
  }
}

run().catch(console.error)
