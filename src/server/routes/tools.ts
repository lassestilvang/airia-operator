import { Router } from 'express'
import { z } from 'zod'

import { addToolLog, findCustomerProfile } from '../../state/store.js'

const crmQuerySchema = z.object({
  name: z.string().min(1),
})

const tasksBodySchema = z.object({
  customer_profile: z.record(z.any()).optional(),
  doc_reference: z.string().optional(),
  tasks: z.array(z.record(z.any())).optional(),
})

const emailBodySchema = z.object({
  to: z.string().email().or(z.string().min(1)),
  subject: z.string().optional(),
  body: z.string().optional(),
})

const slackBodySchema = z.object({
  channel: z.string().optional(),
  message: z.string().optional(),
})

export function createToolRoutes(): Router {
  const router = Router()

  router.get('/crm', (request, response) => {
    const parsed = crmQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return response.status(400).json({
        error: 'Invalid CRM request',
        details: parsed.error.flatten(),
      })
    }

    const profile = findCustomerProfile(parsed.data.name)
    if (!profile) {
      addToolLog('crm', {
        company_name: parsed.data.name,
        found: false,
      })
      return response.status(404).json({
        error: `Customer not found for name=${parsed.data.name}`,
      })
    }

    addToolLog('crm', {
      company_name: parsed.data.name,
      found: true,
      profile,
    })
    return response.json(profile)
  })

  router.post('/tasks', (request, response) => {
    const parsed = tasksBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return response.status(400).json({
        error: 'Invalid task payload',
        details: parsed.error.flatten(),
      })
    }

    addToolLog('tasks', parsed.data)
    return response.status(201).json({
      status: 'ok',
      created: true,
    })
  })

  router.post('/email', (request, response) => {
    const parsed = emailBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return response.status(400).json({
        error: 'Invalid email payload',
        details: parsed.error.flatten(),
      })
    }

    addToolLog('email', parsed.data)
    return response.status(201).json({
      status: 'ok',
      sent: true,
    })
  })

  router.post('/slack', (request, response) => {
    const parsed = slackBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return response.status(400).json({
        error: 'Invalid slack payload',
        details: parsed.error.flatten(),
      })
    }

    addToolLog('slack', parsed.data)
    return response.status(201).json({
      status: 'ok',
      notified: true,
    })
  })

  return router
}
