import { t } from 'elysia';

// Workflow execution request schemas
export const executeWorkflowRequestSchema = t.Object({
  crewId: t.String({ description: 'ID of the crew to execute' }),
  input: t.String({ description: 'Input data for the workflow execution' })
});

export const executeWorkflowResponseSchema = t.Object({
  executionId: t.String({ description: 'Unique identifier for the workflow execution' })
});

// Workflow execution response schemas
export const workflowExecutionResponseSchema = t.Object({
  completedAt: t.Nullable(
    t.Date({ description: 'The date and time the workflow execution completed' })
  ),
  crewId: t.String({ description: 'ID of the crew that was executed' }),
  id: t.String({ description: 'Unique identifier for the workflow execution' }),
  input: t.String({ description: 'Input data that was provided for the workflow' }),
  metadata: t.Nullable(
    t.Record(t.String(), t.Any(), { description: 'Additional metadata about the execution' })
  ),
  result: t.Nullable(t.String({ description: 'Final result of the workflow execution' })),
  startedAt: t.Nullable(
    t.Date({ description: 'The date and time the workflow execution started' })
  ),
  status: t.String({
    description: 'Current status of the workflow execution (running, completed, failed)'
  }),
  userId: t.String({ description: 'ID of the user who initiated the workflow execution' })
});

export const workflowExecutionResponseUnionSchema = t.Union([
  workflowExecutionResponseSchema,
  t.Null()
]);

// Agent execution response schemas
export const agentExecutionResponseSchema = t.Object({
  agent: t.Object({
    name: t.String({ description: 'Name of the agent' }),
    role: t.String({ description: 'Role of the agent in the workflow' })
  }),
  agentId: t.String({ description: 'Unique identifier for the agent' }),
  completedAt: t.Nullable(
    t.Date({ description: 'The date and time the agent execution completed' })
  ),
  cost: t.Nullable(t.Number({ description: 'Cost of the agent execution in currency units' })),
  id: t.String({ description: 'Unique identifier for the agent execution' }),
  input: t.String({ description: 'Input data provided to the agent' }),
  metadata: t.Nullable(
    t.Record(t.String(), t.Any(), { description: 'Additional metadata about the agent execution' })
  ),
  output: t.Nullable(t.String({ description: 'Output from the agent execution' })),
  startedAt: t.Nullable(t.Date({ description: 'The date and time the agent execution started' })),
  status: t.String({
    description: 'Current status of the agent execution (running, completed, failed)'
  }),
  tokensUsed: t.Nullable(t.Number({ description: 'Number of tokens used by the agent' })),
  workflowExecutionId: t.String({
    description: 'ID of the workflow execution this agent execution belongs to'
  })
});

export const workflowExecutionWithDetailsResponseSchema = t.Object({
  agentExecutions: t.Array(agentExecutionResponseSchema, {
    description: 'List of all agent executions in this workflow'
  }),
  execution: workflowExecutionResponseSchema
});

export const workflowExecutionWithDetailsResponseUnionSchema = t.Union([
  workflowExecutionWithDetailsResponseSchema,
  t.Null()
]);

// Parameter schemas
export const workflowIdParamSchema = t.Object({
  id: t.String({ description: 'Unique identifier of the workflow execution' })
});
