import { getConfig } from '../src/config/index.js'
import { createAiriaClient } from '../src/services/airia-client.js'

async function run() {
  const config = getConfig()
  const client = (createAiriaClient(config) as any)
  
  const endpoints = [
    '/v1/Models',
    '/v1/Models?ProjectId=' + (config.airiaProjectId || ''),
    '/marketplace/v1/Library/models',
    '/v1/Library/models',
    '/v1/Marketplace/models'
  ]
  
  for (const ep of endpoints) {
    console.log(`\nTesting ${ep}...`)
    try {
      const res = await client.request(ep, { method: 'GET' })
      console.log(`SUCCESS: ${res.items?.length || 0} models found`)
      if (res.items?.length > 0) {
        console.log(`First model ID: ${res.items[0].id}`)
      }
    } catch (e: any) {
      console.log(`FAILED: ${e.message}`)
    }
  }
}

run().catch(console.error)
