import { getConfig } from '../src/config/index.js'
import { createAiriaClient } from '../src/services/airia-client.js'

async function run() {
  const config = getConfig()
  const client = (createAiriaClient(config) as any)
  
  const stepTypesToTest = [
    'modelStep', 'llmStep', 'completionStep', 'chatStep', 'promptStep', 
    'actionStep', 'toolStep', 'pluginStep', 'functionStep',
    'systemStep', 'systemPromptStep', 'userStep', 'messageStep',
    'pipelineStep', 'subPipelineStep'
  ]

  for (const st of stepTypesToTest) {
    const payload = {
      name: 'Test',
      steps: [
        {
          stepType: st
        }
      ]
    }

    try {
      const result = await client.request('/v1/PipelinesConfig', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      console.log(`SUCCESS for ${st}`)
    } catch (e: any) {
        if (e.message.includes(`Invalid StepType value: ${st}`)) {
            console.log(`INVALID: ${st}`)
        } else {
            console.log(`POTENTIALLY VALID (different error): ${st} -> ${e.message.split('\n')[0]}`)
        }
    }
  }
}

run().catch(console.error)
