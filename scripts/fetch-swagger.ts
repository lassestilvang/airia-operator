import { getConfig } from '../src/config/index.js'
import { createAiriaClient } from '../src/services/airia-client.js'

async function run() {
  const config = getConfig()
  
  // Try to fetch swagger.json
  const urls = [
    `${config.airiaApiBaseUrl}/swagger/v1/swagger.json`,
    `${config.airiaApiBaseUrl}/swagger/docs/v1`,
    `${config.airiaApiBaseUrl}/api-docs`
  ]
  
  for (const url of urls) {
    try {
      console.log(`Fetching ${url}...`)
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        console.log(`SUCCESS! Size: ${JSON.stringify(data).length}`)
        
        // Let's find StepType
        const stepType = data.components?.schemas?.StepType || data.definitions?.StepType
        if (stepType) {
          console.log('StepType:', JSON.stringify(stepType, null, 2))
        } else {
            // search for it
            for (const key in data.components?.schemas) {
                if (key.toLowerCase().includes('step') && data.components.schemas[key].enum) {
                    console.log(`Found enum ${key}:`, data.components.schemas[key].enum)
                }
            }
        }
        
        const interfaceType = data.components?.schemas?.AgentInterface || data.definitions?.AgentInterface
        if (interfaceType) {
            console.log('AgentInterface:', JSON.stringify(interfaceType, null, 2))
        }
        
        break
      }
    } catch (e) {
      console.log('Failed')
    }
  }
}

run().catch(console.error)
