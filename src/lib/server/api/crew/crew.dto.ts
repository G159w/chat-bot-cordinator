import { t } from 'elysia';

// Crew response schemas
export const crewResponseSchema = t.Object({
  createdAt: t.Nullable(t.Date({ description: 'The date and time the crew was created' })),
  description: t.Nullable(t.String({ description: 'Optional description of the crew' })),
  id: t.String({ description: 'Unique identifier for the crew' }),
  isActive: t.Nullable(t.Boolean({ description: 'Whether the crew is currently active' })),
  name: t.String({ description: 'Name of the crew' }),
  updatedAt: t.Nullable(t.Date({ description: 'The date and time the crew was last updated' })),
  userId: t.String({ description: 'ID of the user who owns this crew' })
});

export const crewListResponseSchema = t.Array(crewResponseSchema);

export const crewWithAgentsResponseSchema = t.Composite([
  t.Object({
    agents: t.Array(
      t.Object({
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
        order: t.Nullable(
          t.Number({ description: 'Execution order of the agent in the workflow' })
        ),
        role: t.String({ description: 'Role of the agent in the workflow' }),
        temperature: t.Nullable(t.Number({ description: 'Temperature setting for the AI model' })),
        tools: t.Nullable(
          t.Array(t.String(), { description: 'List of tools available to the agent' })
        )
      })
    )
  }),
  crewResponseSchema
]);

// Crew request schemas
export const createCrewRequestSchema = t.Object({
  agents: t.Optional(
    t.Array(
      t.Object({
        description: t.Optional(t.String({ description: 'Optional description of the agent' })),
        instructions: t.String({ description: 'Instructions for the agent to follow' }),
        isCoordinator: t.Optional(
          t.Boolean({ description: 'Whether this agent coordinates the workflow' })
        ),
        model: t.String({ description: 'AI model to use for this agent' }),
        name: t.String({ description: 'Name of the agent' }),
        order: t.Optional(
          t.Number({ description: 'Execution order of the agent in the workflow' })
        ),
        role: t.String({ description: 'Role of the agent in the workflow' }),
        temperature: t.Optional(t.Number({ description: 'Temperature setting for the AI model' })),
        tools: t.Optional(
          t.Array(t.String(), { description: 'List of tools available to the agent' })
        )
      })
    )
  ),
  description: t.Optional(t.String({ description: 'Optional description of the crew' })),
  name: t.String({ description: 'Name of the crew to create' })
});

export const updateCrewRequestSchema = t.Object({
  description: t.Optional(t.String({ description: 'Optional description of the crew' })),
  isActive: t.Optional(t.Boolean({ description: 'Whether the crew should be active' })),
  name: t.Optional(t.String({ description: 'Name of the crew' }))
});

// Parameter schemas
export const crewIdParamSchema = t.Object({
  id: t.String({ description: 'Unique identifier of the crew', format: 'uuid' })
});
