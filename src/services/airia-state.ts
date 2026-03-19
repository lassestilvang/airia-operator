import { readFile, writeFile } from 'node:fs/promises'

import type { AiriaProvisionState } from '../types/index.js'

const STATE_PATH = '.airia-state.json'

const EMPTY_STATE: AiriaProvisionState = {
  tools: {},
  agents: {},
}

export async function loadAiriaState(): Promise<AiriaProvisionState> {
  try {
    const raw = await readFile(STATE_PATH, 'utf8')
    const parsed = JSON.parse(raw) as AiriaProvisionState
    return {
      tools: parsed.tools ?? {},
      agents: parsed.agents ?? {},
      workflow: parsed.workflow,
    }
  } catch {
    return EMPTY_STATE
  }
}

export async function saveAiriaState(state: AiriaProvisionState): Promise<void> {
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2), 'utf8')
}
