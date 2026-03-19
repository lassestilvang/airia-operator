import { getConfig } from '../src/config/index.js'
import { createAiriaClient } from '../src/services/airia-client.js'

async function run() {
  const config = getConfig()
  const client = (createAiriaClient(config) as any)
  
  const stepTypesToTest = [
    'ModelStep', 'LlmStep', 'CompletionStep', 'ChatStep', 'PromptStep', 
    'ActionStep', 'ToolStep', 'PluginStep', 'FunctionStep',
    'SystemStep', 'SystemPromptStep', 'UserStep', 'MessageStep',
    'PipelineStep', 'SubPipelineStep', 'AssistantStep', 'AgentStep',
    'Model', 'LLM', 'AgentCard', 'InputStep', 'OutputStep', 'AgentCardStep',
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
  ]

  for (const st of stepTypesToTest) {
    const payload = {
      pipelineRequest: {
        name: 'Test',
        steps: [
          {
            stepType: st
          }
        ]
      }
    }

    try {
      const result = await client.request('/v1/PipelinesConfig', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      console.log(`SUCCESS for ${st}`)
    } catch (e: any) {
        if (e.message.includes(`Invalid StepType`)) {
            // console.log(`INVALID: ${st}`)
        } else {
            console.log(`POTENTIALLY VALID (different error): ${st} -> ${e.message.split('\n')[0]}`)
        }
    }
  }
}

run().catch(console.error)
