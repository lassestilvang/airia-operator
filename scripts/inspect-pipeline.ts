import { getConfig } from '../src/config/index.js'
import { createAiriaClient } from '../src/services/airia-client.js'

async function run() {
  const config = getConfig()
  const client = (createAiriaClient(config) as any)
  
  const projectId = config.airiaProjectId ? `&ProjectId=${config.airiaProjectId}` : ''
  const pipelines = await client.request(`/v1/PipelinesConfig?PageNumber=1&PageSize=200${projectId}`, { method: 'GET' })
  
  console.log('Pipelines:', JSON.stringify(pipelines, null, 2))
  
  if (pipelines.items && pipelines.items.length > 0) {
    const first = pipelines.items[0]
    const detail = await client.request(`/v1/PipelinesConfig/${first.id}`, { method: 'GET' })
    console.log('Pipeline Detail:', JSON.stringify(detail, null, 2))
  }
}

run().catch(console.error)
