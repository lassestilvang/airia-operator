import cors from 'cors'
import express from 'express'

import { getConfig } from '../config/index.js'
import { resetState } from '../state/store.js'
import { createWorkflowService } from '../services/workflow-service.js'
import { renderAppHtml } from './html.js'
import { createSystemRoutes } from './routes/system.js'
import { createToolRoutes } from './routes/tools.js'
import { createWorkflowRoutes } from './routes/workflow.js'

const config = getConfig()
const workflowService = createWorkflowService(config)

const app = express()

app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/', (_request, response) => {
  response.type('html').send(renderAppHtml())
})

app.post('/api/demo/reset', (_request, response) => {
  resetState()
  response.status(204).send()
})

app.use('/api/system', createSystemRoutes())
app.use('/api/tools', createToolRoutes())
app.use('/api/workflow', createWorkflowRoutes(workflowService))

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : 'Unknown server error'
  response.status(500).json({ error: message })
})

app.listen(config.port, () => {
  console.log(`Airia Auto-Operator running on http://localhost:${config.port}`)
  if (!config.useAiria) {
    console.log('AIRIA_API_KEY is not set. Running in local simulation mode.')
  }
})
