import { getConfig } from '../src/config/index.js'
import { createAiriaClient } from '../src/services/airia-client.js'

async function run() {
  const config = getConfig()
  const client = (createAiriaClient(config) as any)
  
  const projectId = config.airiaProjectId ? `&ProjectId=${config.airiaProjectId}` : ''
  
  console.log('--- Models ---')
  const models = await client.request('/v1/Models?PageNumber=1&PageSize=50', { method: 'GET' })
  console.log(JSON.stringify(models, null, 2))

  console.log('\n--- Pipelines ---')
  const pipelines = await client.request(`/v1/PipelinesConfig?PageNumber=1&PageSize=200${projectId}`, { method: 'GET' })
  console.log(JSON.stringify(pipelines, null, 2))
}

run().catch(console.error)
