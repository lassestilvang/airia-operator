import type { Response } from 'express'

import type { WorkflowEvent } from '../types/index.js'

interface Subscriber {
  id: string
  response: Response
}

class EventBus {
  private subscribers = new Map<string, Subscriber[]>()

  subscribe(workflowId: string, subscriberId: string, response: Response): void {
    const subscribers = this.subscribers.get(workflowId) ?? []
    subscribers.push({ id: subscriberId, response })
    this.subscribers.set(workflowId, subscribers)
  }

  unsubscribe(workflowId: string, subscriberId: string): void {
    const subscribers = this.subscribers.get(workflowId)
    if (!subscribers) return

    const next = subscribers.filter((subscriber) => subscriber.id !== subscriberId)
    if (next.length === 0) {
      this.subscribers.delete(workflowId)
      return
    }
    this.subscribers.set(workflowId, next)
  }

  publish(event: WorkflowEvent): void {
    const subscribers = this.subscribers.get(event.workflowId)
    if (!subscribers?.length) return

    const payload = `event: workflow_event\ndata: ${JSON.stringify(event)}\n\n`
    for (const subscriber of subscribers) {
      subscriber.response.write(payload)
    }
  }
}

export const eventBus = new EventBus()
