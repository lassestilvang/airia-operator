import { getConfig } from '../src/config/index.js'
import { createAiriaClient } from '../src/services/airia-client.js'

async function run() {
  const config = getConfig()
  const client = (createAiriaClient(config) as any)
  
  const projectId = config.airiaProjectId ? `&ProjectId=${config.airiaProjectId}` : ''
  
  console.log('--- Models ---')
  const models = await client.request('/v1/Models?PageNumber=1&PageSize=50', { method: 'GET' })
  models.items.forEach((m: any) => console.log(`- ${m.displayName} (${m.id}) provider: ${m.provider}`))

  console.log('\n--- Recent Executions ---')
  const pipelines = await client.request(`/v1/PipelinesConfig?PageNumber=1&PageSize=200${projectId}`, { method: 'GET' })
  
  for (const pipeline of pipelines.items) {
    if (pipeline.executionStats?.failureCount > 0) {
      console.log(`\nAgent: ${pipeline.name} (${pipeline.id}) - Failures: ${pipeline.executionStats.failureCount}`)
      
      // Try to get the latest execution for this pipeline
      try {
        const executions = await client.request(`/v1/PipelineExecution/Pipeline/${pipeline.id}?PageNumber=1&PageSize=1`, { method: 'GET' })
        if (executions.items && executions.items.length > 0) {
          const latest = executions.items[0]
          console.log(`Latest Execution ID: ${latest.id} (Status: ${latest.status})`)
          
          // Fetch the full report
          const report = await client.request(`/v1/PipelineExecution/${latest.id}`, { method: 'GET' })
          console.log('Full Report Details:')
          console.log(JSON.stringify(report, null, 2))
        }
      } catch (e) {
        console.log('Could not fetch execution history for this pipeline.')
      }
    }
  }
}

run().catch(console.error)
