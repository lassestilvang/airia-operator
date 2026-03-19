import type { AiriaAgentSpec, AiriaToolSpec } from './airia-client.js'

export const WORKFLOW_NAME = 'enterprise_customer_onboarding'

export function buildToolSpecs(appBaseUrl: string): AiriaToolSpec[] {
  return [
    {
      key: 'mock-crm',
      payload: {
        toolType: 'custom',
        name: 'mock-crm',
        standardizedName: 'mock-crm',
        description: 'Retrieve customer profile data from mock CRM',
        provider: 'custom',
        purpose: 'Fetch customer onboarding profile by company name',
        methodType: 'Get',
        apiEndpoint: `${appBaseUrl}/api/tools/crm`,
        parameters: [
          {
            name: 'name',
            type: 'string',
            description: 'Company name',
            requirement: 'Required',
          },
        ],
        headers: [],
        bodyType: 'None',
        requestTimeout: 30,
        routeThroughACC: false,
        shouldRedirect: false,
        category: 'Action',
        toolCredentials: {
          authRequired: false,
          useUserCredentials: false,
          useAiriaKeySupport: false,
        },
      },
    },
    {
      key: 'mock-tasks',
      payload: {
        toolType: 'custom',
        name: 'mock-tasks',
        standardizedName: 'mock-tasks',
        description: 'Create onboarding tasks in mock task system',
        provider: 'custom',
        purpose: 'Create onboarding tasks for operations teams',
        methodType: 'Post',
        apiEndpoint: `${appBaseUrl}/api/tools/tasks`,
        parameters: [],
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
            sensitive: false,
          },
        ],
        bodyType: 'Json',
        requestTimeout: 30,
        routeThroughACC: false,
        shouldRedirect: false,
        category: 'Action',
        toolCredentials: {
          authRequired: false,
          useUserCredentials: false,
          useAiriaKeySupport: false,
        },
      },
    },
    {
      key: 'send-email',
      payload: {
        toolType: 'custom',
        name: 'send-email',
        standardizedName: 'send-email',
        description: 'Send onboarding email via mock email service',
        provider: 'custom',
        purpose: 'Send onboarding instructions to customer contact email',
        methodType: 'Post',
        apiEndpoint: `${appBaseUrl}/api/tools/email`,
        parameters: [],
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
            sensitive: false,
          },
        ],
        bodyType: 'Json',
        requestTimeout: 30,
        routeThroughACC: false,
        shouldRedirect: false,
        category: 'Action',
        toolCredentials: {
          authRequired: false,
          useUserCredentials: false,
          useAiriaKeySupport: false,
        },
      },
    },
    {
      key: 'send-slack',
      payload: {
        toolType: 'custom',
        name: 'send-slack',
        standardizedName: 'send-slack',
        description: 'Send onboarding notification to mock Slack channel',
        provider: 'custom',
        purpose: 'Notify internal teams that onboarding has started',
        methodType: 'Post',
        apiEndpoint: `${appBaseUrl}/api/tools/slack`,
        parameters: [],
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
            sensitive: false,
          },
        ],
        bodyType: 'Json',
        requestTimeout: 30,
        routeThroughACC: false,
        shouldRedirect: false,
        category: 'Action',
        toolCredentials: {
          authRequired: false,
          useUserCredentials: false,
          useAiriaKeySupport: false,
        },
      },
    },
  ]
}

export function buildAgentSpecs(): AiriaAgentSpec[] {
  return [
    {
      key: 'crm',
      name: 'CRM Agent',
      description: 'Retrieve structured customer data using CRM tools.',
      prompt: 'You are a CRM agent. Retrieve structured customer data using the provided tool. Do not infer missing data.',
      tools: ['mock-crm'],
    },
    {
      key: 'docs',
      name: 'Docs Agent',
      description: 'Generate onboarding docs in markdown format.',
      prompt: 'You generate onboarding documentation for enterprise customers. Output clean markdown.',
    },
    {
      key: 'ops',
      name: 'Ops Agent',
      description: 'Create actionable onboarding tasks for internal teams.',
      prompt: 'You create actionable onboarding tasks for internal teams. Tasks must be clear and assignable.',
      tools: ['mock-tasks'],
    },
    {
      key: 'comms',
      name: 'Comms Agent',
      description: 'Send professional external and internal communications.',
      prompt: 'You communicate with customers professionally. Email must be clear, concise, and actionable.',
      tools: ['send-email', 'send-slack'],
    },
    {
      key: 'governance',
      name: 'Governance Agent',
      description: 'Apply enterprise governance rules and require approvals.',
      prompt: 'You enforce enterprise safety rules. Block or require approval when necessary.',
    },
  ]
}
