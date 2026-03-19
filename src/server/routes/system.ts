import { Router } from 'express'

import { getConfig } from '../../config/index.js'
import { getToolLogs } from '../../state/store.js'

export function createSystemRoutes(): Router {
  const router = Router()

  router.get('/health', (_request, response) => {
    const config = getConfig()
    return response.json({
      ok: true,
      mode: config.approvalMode,
      useAiria: config.useAiria,
      timestamp: new Date().toISOString(),
    })
  })

  router.get('/logs', (_request, response) => {
    return response.json({
      logs: getToolLogs(),
    })
  })

  return router
}
