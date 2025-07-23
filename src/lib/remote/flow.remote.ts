import { command, query } from '$app/server';
import { Boolean, Number, Object, Optional, Record, String } from '@sinclair/typebox';
import { Zod } from '@sinclair/typemap';

import { getServerApiClient } from '../server-api-client';

// Flow execution schemas
const executeFlowRequestSchema = Zod(
  Object({
    flowId: String({ description: 'ID of the flow to execute' }),
    input: Record(String(), String(), { description: 'Input data for the flow execution' })
  })
);

const flowExecutionIdParamSchema = Zod(
  Object({
    id: String({ description: 'Unique identifier of the flow execution' })
  })
);

// Flow management schemas
const createFlowRequestSchema = Zod(
  Object({
    crewId: String({ description: 'ID of the crew this flow belongs to' }),
    description: Optional(String({ description: 'Description of the flow' })),
    name: String({ description: 'Name of the flow' })
  })
);

const _updateFlowRequestSchema = Zod(
  Object({
    description: Optional(String({ description: 'Description of the flow' })),
    isActive: Optional(Boolean({ description: 'Whether the flow is active' })),
    name: Optional(String({ description: 'Name of the flow' }))
  })
);

const flowIdParamSchema = Zod(
  Object({
    id: String({ description: 'Unique identifier of the flow' })
  })
);

const crewIdParamSchema = Zod(
  Object({
    id: String({ description: 'Unique identifier of the crew' })
  })
);

// Task management schemas
const createTaskRequestSchema = Zod(
  Object({
    config: Optional(Record(String(), String(), { description: 'Task-specific configuration' })),
    description: Optional(String({ description: 'Description of the task' })),
    flowId: String({ description: 'ID of the flow this task belongs to' }),
    name: String({ description: 'Name of the task' }),
    order: Number({ description: 'Execution order of the task within the flow' }),
    taskType: String({ description: 'Type of the task (agent, condition, input, etc.)' })
  })
);

const _updateTaskRequestSchema = Zod(
  Object({
    config: Optional(Record(String(), String(), { description: 'Task-specific configuration' })),
    description: Optional(String({ description: 'Description of the task' })),
    name: Optional(String({ description: 'Name of the task' })),
    order: Optional(Number({ description: 'Execution order of the task within the flow' })),
    taskType: Optional(String({ description: 'Type of the task' }))
  })
);

const taskIdParamSchema = Zod(
  Object({
    id: String({ description: 'Unique identifier of the task' })
  })
);

// Flow execution functions
export const executeFlow = command(executeFlowRequestSchema, async (data) => {
  const result = await getServerApiClient().api.flows.execute.post(data);
  if (result.error) {
    throw new Error('Failed to execute flow', { cause: result.error });
  }
  return result.data;
});

export const getFlowExecutionStatus = query(flowExecutionIdParamSchema, async ({ id }) => {
  const result = await getServerApiClient().api.flows.executions({ id }).get();
  if (result.error) {
    throw new Error('Failed to get flow execution status', { cause: result.error });
  }
  return result.data;
});

export const getFlowExecutionDetails = query(flowExecutionIdParamSchema, async ({ id }) => {
  const result = await getServerApiClient().api.flows.executions({ id })['details'].get();
  if (result.error) {
    throw new Error('Failed to get flow execution details', { cause: result.error });
  }
  return result.data;
});

// Flow management functions
export const createFlow = command(createFlowRequestSchema, async (data) => {
  const result = await getServerApiClient().api.flows.post(data);
  if (result.error) {
    throw new Error('Failed to create flow', { cause: result.error });
  }
  return result.data;
});

export const getFlowsByCrew = query(crewIdParamSchema, async ({ id }) => {
  const result = await getServerApiClient().api.crews({ id }).flows.get();
  if (result.error) {
    throw new Error('Failed to get flows by crew', { cause: result.error });
  }
  return result.data;
});

const updateFlowRequestWithIdSchema = Zod(
  Object({
    description: Optional(String({ description: 'Description of the flow' })),
    id: String({ description: 'Unique identifier of the flow' }),
    isActive: Optional(Boolean({ description: 'Whether the flow is active' })),
    name: Optional(String({ description: 'Name of the flow' }))
  })
);

export const updateFlow = command(updateFlowRequestWithIdSchema, async ({ id, ...data }) => {
  const result = await getServerApiClient().api.flows({ id }).put(data);
  if (result.error) {
    throw new Error('Failed to update flow', { cause: result.error });
  }
  return result.data;
});

export const deleteFlow = command(flowIdParamSchema, async ({ id }) => {
  const result = await getServerApiClient().api.flows({ id }).delete();
  if (result.error) {
    throw new Error('Failed to delete flow', { cause: result.error });
  }
  return result.data;
});

// Task management functions
export const createTask = command(createTaskRequestSchema, async (data) => {
  const result = await getServerApiClient().api.tasks.post(data);
  if (result.error) {
    throw new Error('Failed to create task', { cause: result.error });
  }
  return result.data;
});

export const getTasksByFlow = query(flowIdParamSchema, async ({ id }) => {
  const result = await getServerApiClient().api.flows({ id }).tasks.get();
  if (result.error) {
    throw new Error('Failed to get tasks by flow', { cause: result.error });
  }
  return result.data;
});

const updateTaskRequestWithIdSchema = Zod(
  Object({
    config: Optional(Record(String(), String(), { description: 'Task-specific configuration' })),
    description: Optional(String({ description: 'Description of the task' })),
    id: String({ description: 'Unique identifier of the task' }),
    name: Optional(String({ description: 'Name of the task' })),
    order: Optional(Number({ description: 'Execution order of the task within the flow' })),
    taskType: Optional(String({ description: 'Type of the task' }))
  })
);

export const updateTask = command(updateTaskRequestWithIdSchema, async ({ id, ...data }) => {
  const result = await getServerApiClient().api.tasks({ id }).put(data);
  if (result.error) {
    throw new Error('Failed to update task', { cause: result.error });
  }
  return result.data;
});

export const deleteTask = command(taskIdParamSchema, async ({ id }) => {
  const result = await getServerApiClient().api.tasks({ id }).delete();
  if (result.error) {
    throw new Error('Failed to delete task', { cause: result.error });
  }
  return result.data;
});
