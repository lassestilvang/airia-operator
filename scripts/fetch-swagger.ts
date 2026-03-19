import { getConfig } from '../src/config/index.js'
import { createAiriaClient } from '../src/services/airia-client.js'

async function run() {
  const config = getConfig()
  
  // Try to fetch swagger.json
  const urls = [
    `${config.airiaApiBaseUrl}/swagger/v1/swagger.json`,
  ]
  
  for (const url of urls) {
    try {
      console.log(`Fetching ${url}...`)
      const res = await fetch(url, {
        headers: {
            'X-API-Key': config.airiaApiKey || ''
        }
      })
      console.log(`Status: ${res.status}`)
      if (res.ok) {
        const data = await res.json()
        const stepType = data.components?.schemas?.StepType || data.definitions?.StepType
        if (stepType) {
          console.log('StepType:', JSON.stringify(stepType, null, 2))
        } else {
            console.log("No StepType found in swagger")
        }
      }
    } catch (e) {
      console.log('Failed')
    }
  }
}

run().catch(console.error)
