import dotenv from 'dotenv'

import type { AppConfig } from '../types/index.js'

dotenv.config()

function parsePort(raw: string | undefined): number {
  if (!raw) return 3000
  const port = Number(raw)
  return Number.isFinite(port) && port > 0 ? port : 3000
}

export function getConfig(): AppConfig {
  const port = parsePort(process.env.PORT)
  const appBaseUrl = process.env.APP_BASE_URL ?? `http://localhost:${port}`
  const airiaApiBaseUrl = process.env.AIRIA_API_BASE_URL ?? 'https://api.airia.ai'
  const airiaApiKey = process.env.AIRIA_API_KEY
  const airiaProjectId = process.env.AIRIA_PROJECT_ID

  return {
    port,
    approvalMode: 'manual',
    appBaseUrl,
    airiaApiBaseUrl,
    airiaApiKey,
    airiaProjectId,
    useAiria: Boolean(airiaApiKey),
  }
}
