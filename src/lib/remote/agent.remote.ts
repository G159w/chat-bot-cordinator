import { command, query } from '$app/server';
import { Boolean, Number, Object, Optional, String } from '@sinclair/typebox';
import { Valibot } from '@sinclair/typemap';

import { getServerApiClient } from '../server-api-client';

const agentListQuerySchema = Valibot(
  Object({
    crewId: String({ description: 'ID of the crew to list agents for' })
  })
);

const createAgentRequestSchema = Valibot(
  Object({
    crewId: Optional(String({ description: 'ID of the crew to add the agent to' })),
    description: Optional(String({ description: 'Optional description of the agent' })),
    instructions: String({ description: 'Instructions for the agent to follow' }),
    isCoordinator: Optional(
      Boolean({ description: 'Whether this agent coordinates the workflow' })
    ),
    model: String({ description: 'AI model to use for this agent' }),
    name: String({ description: 'Name of the agent' }),
    order: Optional(Number({ description: 'Execution order of the agent in the workflow' })),
    role: String({ description: 'Role of the agent in the workflow' }),
    temperature: Optional(Number({ description: 'Temperature setting for the AI model' }))
  })
);

export const listAgents = query(agentListQuerySchema, async ({ crewId }) => {
  const result = await getServerApiClient().api.agents.get({ query: { crewId } });
  if (result.error) {
    throw new Error('Failed to list agents', { cause: result.error });
  }
  return result.data;
});

export const createAgent = command(createAgentRequestSchema, async (data) => {
  const result = await getServerApiClient().api.agents.post(data);
  if (result.error) {
    throw new Error('Failed to create agent', { cause: result.error });
  }
  return result.data;
});

export const updateAgent = command(
  Valibot(
    Object({
      description: Optional(String({ description: 'Optional description of the agent' })),
      id: String({ description: 'Unique identifier of the agent' }),
      instructions: Optional(String({ description: 'Instructions for the agent to follow' })),
      isCoordinator: Optional(
        Boolean({ description: 'Whether this agent coordinates the workflow' })
      ),
      model: Optional(String({ description: 'AI model to use for this agent' })),
      name: Optional(String({ description: 'Name of the agent' })),
      order: Optional(Number({ description: 'Execution order of the agent in the workflow' })),
      role: Optional(String({ description: 'Role of the agent in the workflow' })),
      temperature: Optional(Number({ description: 'Temperature setting for the AI model' }))
    })
  ),
  async ({ id, ...data }) => {
    const result = await getServerApiClient().api.agents({ id }).put(data);
    if (result.error) {
      throw new Error('Failed to update agent', { cause: result.error });
    }
    return result.data;
  }
);

export const deleteAgent = command(
  Valibot(Object({ id: String({ description: 'Unique identifier of the agent' }) })),
  async ({ id }) => {
    const result = await getServerApiClient().api.agents({ id }).delete();
    if (result.error) {
      throw new Error('Failed to delete agent', { cause: result.error });
    }
    return result.data;
  }
);
