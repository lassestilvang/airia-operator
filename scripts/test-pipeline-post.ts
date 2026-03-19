import { getConfig } from '../src/config/index.js'
import { createAiriaClient } from '../src/services/airia-client.js'

async function run() {
  const config = getConfig()
  const client = (createAiriaClient(config) as any)
  
  const payload = {
    name: 'Test Pipeline Creation',
    description: 'Test',
    projectId: config.airiaProjectId ?? '00000000-0000-0000-0000-000000000000',
    alignment: 'Vertical',
    steps: [
      {
        id: "278ce0cc-131d-4376-999d-6afbc2784e28",
        stepType: "inputStep",
        stepTitle: "Input",
        handles: [
          { id: "2913043c-976b-417f-a59b-fa21f32b4d96", type: "source", uuid: "5de94a03-2a6f-409f-8a80-d696878a2a46" }
        ],
        dependenciesObject: []
      },
      {
        id: "5cb0a8d8-b2d8-474d-a331-1d96aa31513f",
        stepType: "assistantStep",
        stepTitle: "Assistant",
        modelId: "5ceb94de-9f46-4399-87dc-3cf80b2b8315",
        instructions: "Test",
        skills: [],
        handles: [
          { id: "0fa6d7fe-93f1-4381-8a8c-da4e8e09379e", type: "target", uuid: "085f7fd4-c14c-49c8-ad0a-a5d989e30cab" },
          { id: "6961c0a1-0b4b-40b4-9719-973d20a4a107", type: "source", uuid: "0f3722ad-fd05-49ad-83a3-72de9aef81ea" }
        ],
        dependenciesObject: [
          {
            parentId: "278ce0cc-131d-4376-999d-6afbc2784e28",
            parentHandleId: "5de94a03-2a6f-409f-8a80-d696878a2a46",
            handleId: "085f7fd4-c14c-49c8-ad0a-a5d989e30cab",
            id: "2b6a8241-fd26-4f6e-9462-4c23c0ae4e75"
          }
        ]
      },
      {
        id: "c82f0e76-d769-4ef3-bc3d-23b3cd54b1ef",
        stepType: "outputStep",
        stepTitle: "Output",
        handles: [
          { id: "d62b19b5-24b9-4358-88d3-820064fad456", type: "target", uuid: "98b640f8-24e6-45a3-bb77-bec3a56a1317" }
        ],
        dependenciesObject: [
          {
            parentId: "5cb0a8d8-b2d8-474d-a331-1d96aa31513f",
            parentHandleId: "0f3722ad-fd05-49ad-83a3-72de9aef81ea",
            handleId: "98b640f8-24e6-45a3-bb77-bec3a56a1317",
            id: "e5bf7291-da45-465d-a785-9150ca68d554"
          }
        ]
      }
    ]
  }

  try {
    const result = await client.request('/v1/PipelinesConfig?skipProjectId=true', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    console.log(`SUCCESS: ${JSON.stringify(result)}`)
  } catch (e: any) {
    console.log(`FAILED: ${e.message}`)
  }
}

run().catch(console.error)
