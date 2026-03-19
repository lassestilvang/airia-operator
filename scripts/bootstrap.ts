import { getConfig } from '../src/config/index.js'
import { createAiriaClient } from '../src/services/airia-client.js'
import { loadAiriaState, saveAiriaState } from '../src/services/airia-state.js'
import { buildAgentSpecs, buildToolSpecs, WORKFLOW_NAME } from '../src/services/specs.js'

async function run(): Promise<void> {
  const config = getConfig()

  if (!config.airiaApiKey) {
    console.log('Skipping Airia bootstrap: AIRIA_API_KEY is not set')
    return
  }

  const client = createAiriaClient(config)
  const tools = buildToolSpecs(config.appBaseUrl)
  const agents = buildAgentSpecs()

  console.log('Bootstrapping Airia resources...')
  console.log(`- base url: ${config.airiaApiBaseUrl}`)
  console.log(`- app base url: ${config.appBaseUrl}`)
  console.log(`- workflow: ${WORKFLOW_NAME}`)

  const result = await client.provision({
    tools,
    agents,
    workflowName: WORKFLOW_NAME,
  })

  const previous = await loadAiriaState()
  const next = {
    ...previous,
    tools: result.tools,
    agents: result.agents,
    workflow: result.workflow,
  }
  await saveAiriaState(next)

  console.log('Airia bootstrap complete')
  console.log(JSON.stringify(next, null, 2))
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Bootstrap failed: ${message}`)
  process.exit(1)
})
