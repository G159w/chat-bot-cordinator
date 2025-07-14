import { t } from 'elysia';

// Agent response schemas
export const agentResponseSchema = t.Object({
  createdAt: t.Nullable(t.Date({ description: 'The date and time the agent was created' })),
  crewId: t.Nullable(t.String({ description: 'ID of the crew this agent belongs to' })),
  description: t.Nullable(t.String({ description: 'Optional description of the agent' })),
  id: t.String({ description: 'Unique identifier for the agent' }),
  instructions: t.String({ description: 'Instructions for the agent to follow' }),
  isCoordinator: t.Nullable(
    t.Boolean({ description: 'Whether this agent coordinates the workflow' })
  ),
  model: t.String({ description: 'AI model to use for this agent' }),
  name: t.String({ description: 'Name of the agent' }),
  order: t.Nullable(t.Number({ description: 'Execution order of the agent in the workflow' })),
  role: t.String({ description: 'Role of the agent in the workflow' }),
  temperature: t.Nullable(t.Number({ description: 'Temperature setting for the AI model' })),
  tools: t.Nullable(t.Array(t.String(), { description: 'List of tools available to the agent' }))
});

export const agentListResponseSchema = t.Array(agentResponseSchema);

// Agent request schemas
export const createAgentRequestSchema = t.Object({
  crewId: t.Optional(t.String({ description: 'ID of the crew to add the agent to' })),
  description: t.Optional(t.String({ description: 'Optional description of the agent' })),
  instructions: t.String({ description: 'Instructions for the agent to follow' }),
  isCoordinator: t.Optional(
    t.Boolean({ description: 'Whether this agent coordinates the workflow' })
  ),
  model: t.String({ description: 'AI model to use for this agent' }),
  name: t.String({ description: 'Name of the agent' }),
  order: t.Optional(t.Number({ description: 'Execution order of the agent in the workflow' })),
  role: t.String({ description: 'Role of the agent in the workflow' }),
  temperature: t.Optional(t.Number({ description: 'Temperature setting for the AI model' })),
  tools: t.Optional(t.Array(t.String(), { description: 'List of tools available to the agent' }))
});

// Query schemas
export const agentListQuerySchema = t.Object({
  crewId: t.String({ description: 'ID of the crew to list agents for' })
});
