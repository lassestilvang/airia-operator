import { getConfig } from './src/config/index.js'
import { createAiriaClient } from './src/services/airia-client.js'

async function debug() {
  const config = getConfig()
  if (!config.airiaApiKey) {
    console.error('AIRIA_API_KEY not set')
    return
  }

  const client = createAiriaClient(config)
  
  console.log('Fetching swarms...')
  // @ts-ignore
  const swarms = await client.listSwarms()
  console.log('Swarms count:', swarms.length)
  if (swarms.length > 0) console.log('Swarms[0]:', swarms[0])
  
  console.log('Fetching tools...')
  // @ts-ignore
  const tools = await client.listTools()
  console.log('Tools count:', tools.length)
  if (tools.length > 0) console.log('Tools[0]:', tools[0])

  console.log('Fetching pipelines...')
  // @ts-ignore
  const pipelines = await client.listPipelines()
  console.log('Pipelines count:', pipelines.length)
  if (pipelines.length > 0) console.log('Pipelines[0]:', pipelines[0])
}

debug().catch(console.error)
