import { getConfig } from '../src/config/index.js'
import { createAiriaClient } from '../src/services/airia-client.js'

async function run() {
  const config = getConfig()
  const client = (createAiriaClient(config) as any)
  
  const testPipelineId = 'dc4e7f88-76a6-4b9a-9934-4a22701d797e'
  
  try {
    console.log(`Executing ${testPipelineId}...`)
    const response = await client.request(`/v1/PipelineExecution/${testPipelineId}`, {
      method: 'POST',
      body: JSON.stringify({
        userInput: 'Test message',
        includeToolsResponse: true,
        saveHistory: true
      })
    })
    console.log('SUCCESS:', JSON.stringify(response, null, 2))
  } catch (e: any) {
    console.log('EXECUTION FAILED:')
    // Airia errors are thrown as Error objects with the full response body in the message
    console.log(e.message)
    
    // Try to parse the execution ID from the error message to get the report
    const match = e.message.match(/"executionId":"([^"]+)"/)
    if (match) {
        const executionId = match[1]
        console.log(`\nFound execution ID in error: ${executionId}`)
        try {
            const report = await client.request(`/v1/PipelineExecution/${executionId}`, { method: 'GET' })
            console.log('Full Report Details:')
            console.log(JSON.stringify(report, null, 2))
        } catch (reportErr: any) {
            console.log(`Failed to fetch report: ${reportErr.message}`)
        }
    }
  }
}

run().catch(console.error)
