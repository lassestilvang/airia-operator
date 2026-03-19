import { randomUUID } from 'node:crypto'

import { Router } from 'express'
import { z } from 'zod'

import type { WorkflowService } from '../../services/workflow-service.js'
import { eventBus } from '../../services/event-bus.js'
import { getToolLogs } from '../../state/store.js'

const runSchema = z.object({
  goal: z.string().min(1),
})

const approveSchema = z.object({
  workflow_id: z.string().uuid(),
  decision: z.enum(['approve', 'reject']),
})

export function createWorkflowRoutes(workflowService: WorkflowService): Router {
  const router = Router()

  router.get('/_debug/tool-logs', (_request, response) => {
    return response.json({
      logs: getToolLogs(),
    })
  })

  router.post('/run', async (request, response) => {
    const parsed = runSchema.safeParse(request.body)
    if (!parsed.success) {
      return response.status(400).json({
        error: 'Invalid workflow run payload',
        details: parsed.error.flatten(),
      })
    }

    const result = await workflowService.run(parsed.data.goal)
    return response.status(202).json({
      workflow_id: result.workflowId,
      status: 'running',
    })
  })

  router.get('/:id/stream', (request, response) => {
    const workflowId = request.params.id
    const workflow = workflowService.get(workflowId)

    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })

    const subscriberId = randomUUID()
    eventBus.subscribe(workflowId, subscriberId, response)

    response.write(`event: workflow_snapshot\ndata: ${JSON.stringify(workflow)}\n\n`)

    const ping = setInterval(() => {
      response.write(`event: ping\ndata: {"ts":"${new Date().toISOString()}"}\n\n`)
    }, 10000)

    request.on('close', () => {
      clearInterval(ping)
      eventBus.unsubscribe(workflowId, subscriberId)
    })
  })

  router.post('/approve', (request, response) => {
    const parsed = approveSchema.safeParse(request.body)
    if (!parsed.success) {
      return response.status(400).json({
        error: 'Invalid approval payload',
        details: parsed.error.flatten(),
      })
    }

    const result = workflowService.approve(parsed.data.workflow_id, parsed.data.decision)
    return response.json(result)
  })

  router.get('/:id', (request, response) => {
    const workflow = workflowService.get(request.params.id)
    return response.json(workflow)
  })

  return router
}
