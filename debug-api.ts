import { getConfig } from './src/config/index.js'
import { createAiriaClient } from './src/services/airia-client.js'

async function debug() {
  const config = getConfig()
  if (!config.airiaApiKey) {
    console.error('AIRIA_API_KEY not set')
    return
  }

  const client = createAiriaClient(config)
  // Access private methods using type casting if necessary, 
  // but better to just use public if possible or modify client temporarily.
  // Since I can modify the code, I'll just add a public debug method or use provision.
  
  console.log('Fetching swarms...')
  // @ts-ignore - accessing private for debug
  const swarms = await client.listSwarms()
  console.log('Swarms found:', JSON.stringify(swarms, null, 2))
  
  const name = 'enterprise_customer_onboarding'
  const found = swarms.find(s => s.name === name)
  console.log(`Searching for "${name}":`, found ? 'FOUND' : 'NOT FOUND')
}

debug().catch(console.error)
