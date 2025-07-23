import { t } from 'elysia';

// Flow execution request schemas
export const executeFlowRequestSchema = t.Object({
  flowId: t.String({ description: 'ID of the flow to execute' }),
  input: t.Record(t.String(), t.Any(), { description: 'Input data for the flow execution' })
});

export const executeFlowResponseSchema = t.Object({
  executionId: t.String({ description: 'Unique identifier for the flow execution' })
});

// Flow execution response schemas
export const flowExecutionResponseSchema = t.Object({
  completedAt: t.Nullable(
    t.Date({ description: 'The date and time the flow execution completed' })
  ),
  createdAt: t.Nullable(
    t.Date({ description: 'The date and time the flow execution was created' })
  ),
  flowId: t.String({ description: 'ID of the flow that was executed' }),
  id: t.String({ description: 'Unique identifier for the flow execution' }),
  input: t.Nullable(
    t.Record(t.String(), t.Any(), { description: 'Input data that was provided for the flow' })
  ),
  metadata: t.Nullable(
    t.Record(t.String(), t.Any(), { description: 'Additional metadata about the execution' })
  ),
  result: t.Nullable(
    t.Record(t.String(), t.Any(), { description: 'Final result of the flow execution' })
  ),
  status: t.String({
    description: 'Current status of the flow execution (pending, running, completed, failed)'
  }),
  userId: t.String({ description: 'ID of the user who initiated the flow execution' })
});

export const flowExecutionResponseUnionSchema = t.Union([flowExecutionResponseSchema, t.Null()]);

// Task execution response schemas
export const taskExecutionResponseSchema = t.Object({
  completedAt: t.Nullable(
    t.Date({ description: 'The date and time the task execution completed' })
  ),
  cost: t.Nullable(t.Number({ description: 'Cost of the task execution in currency units' })),
  createdAt: t.Date({ description: 'The date and time the task execution was created' }),
  duration: t.Nullable(t.Number({ description: 'Duration of the task execution in milliseconds' })),
  error: t.Nullable(t.String({ description: 'Error message if the task execution failed' })),
  flowExecutionId: t.String({
    description: 'ID of the flow execution this task execution belongs to'
  }),
  id: t.String({ description: 'Unique identifier for the task execution' }),
  input: t.Nullable(
    t.Record(t.String(), t.Any(), { description: 'Input data provided to the task' })
  ),
  metadata: t.Nullable(
    t.Record(t.String(), t.Any(), { description: 'Additional metadata about the task execution' })
  ),
  output: t.Nullable(
    t.Record(t.String(), t.Any(), { description: 'Output from the task execution' })
  ),
  startedAt: t.Nullable(t.Date({ description: 'The date and time the task execution started' })),
  status: t.String({
    description: 'Current status of the task execution (pending, running, completed, failed)'
  }),
  taskId: t.String({ description: 'ID of the task that was executed' }),
  tokensUsed: t.Nullable(t.Number({ description: 'Number of tokens used by the task' }))
});

export const flowExecutionWithDetailsResponseSchema = t.Object({
  execution: flowExecutionResponseSchema,
  taskExecutions: t.Array(taskExecutionResponseSchema, {
    description: 'List of all task executions in this flow'
  })
});

export const flowExecutionWithDetailsResponseUnionSchema = t.Union([
  flowExecutionWithDetailsResponseSchema,
  t.Null()
]);

// Flow management schemas
export const createFlowRequestSchema = t.Object({
  crewId: t.String({ description: 'ID of the crew this flow belongs to' }),
  description: t.Optional(t.String({ description: 'Description of the flow' })),
  name: t.String({ description: 'Name of the flow' })
});

export const flowResponseSchema = t.Object({
  createdAt: t.Date({ description: 'The date and time the flow was created' }),
  crewId: t.String({ description: 'ID of the crew this flow belongs to' }),
  description: t.Nullable(t.String({ description: 'Description of the flow' })),
  id: t.String({ description: 'Unique identifier for the flow' }),
  isActive: t.Boolean({ description: 'Whether the flow is active' }),
  name: t.String({ description: 'Name of the flow' }),
  updatedAt: t.Date({ description: 'The date and time the flow was last updated' })
});

// Task management schemas
export const createTaskRequestSchema = t.Object({
  config: t.Optional(t.Record(t.String(), t.Any(), { description: 'Task-specific configuration' })),
  description: t.Optional(t.String({ description: 'Description of the task' })),
  flowId: t.String({ description: 'ID of the flow this task belongs to' }),
  name: t.String({ description: 'Name of the task' }),
  order: t.Number({ description: 'Execution order of the task within the flow' }),
  taskType: t.String({ description: 'Type of the task (agent, condition, input, etc.)' })
});

export const taskResponseSchema = t.Object({
  config: t.Nullable(t.Record(t.String(), t.Any(), { description: 'Task-specific configuration' })),
  createdAt: t.Date({ description: 'The date and time the task was created' }),
  description: t.Nullable(t.String({ description: 'Description of the task' })),
  flowId: t.String({ description: 'ID of the flow this task belongs to' }),
  id: t.String({ description: 'Unique identifier for the task' }),
  name: t.String({ description: 'Name of the task' }),
  order: t.Number({ description: 'Execution order of the task within the flow' }),
  taskType: t.String({ description: 'Type of the task' }),
  updatedAt: t.Date({ description: 'The date and time the task was last updated' })
});

// Task input/output schemas
export const createTaskInputRequestSchema = t.Object({
  inputType: t.String({ description: 'Type of input (manual, hook, previous_task, etc.)' }),
  name: t.String({ description: 'Name of the input' }),
  required: t.Optional(t.Boolean({ description: 'Whether the input is required' })),
  taskId: t.String({ description: 'ID of the task this input belongs to' }),
  value: t.Optional(t.String({ description: 'Default value or configuration' }))
});

export const taskInputResponseSchema = t.Object({
  createdAt: t.Date({ description: 'The date and time the task input was created' }),
  id: t.String({ description: 'Unique identifier for the task input' }),
  inputType: t.String({ description: 'Type of input' }),
  name: t.String({ description: 'Name of the input' }),
  required: t.Boolean({ description: 'Whether the input is required' }),
  taskId: t.String({ description: 'ID of the task this input belongs to' }),
  value: t.Nullable(t.String({ description: 'Default value or configuration' }))
});

export const createTaskOutputRequestSchema = t.Object({
  name: t.String({ description: 'Name of the output' }),
  outputType: t.String({ description: 'Type of output (text, json, file, etc.)' }),
  taskId: t.String({ description: 'ID of the task this output belongs to' })
});

export const taskOutputResponseSchema = t.Object({
  createdAt: t.Date({ description: 'The date and time the task output was created' }),
  id: t.String({ description: 'Unique identifier for the task output' }),
  name: t.String({ description: 'Name of the output' }),
  outputType: t.String({ description: 'Type of output' }),
  taskId: t.String({ description: 'ID of the task this output belongs to' })
});

// Task connection schemas
export const createTaskConnectionRequestSchema = t.Object({
  sourceOutputId: t.String({ description: 'ID of the source task output' }),
  sourceTaskId: t.String({ description: 'ID of the source task' }),
  targetInputId: t.String({ description: 'ID of the target task input' }),
  targetTaskId: t.String({ description: 'ID of the target task' })
});

export const taskConnectionResponseSchema = t.Object({
  createdAt: t.Date({ description: 'The date and time the task connection was created' }),
  id: t.String({ description: 'Unique identifier for the task connection' }),
  sourceOutputId: t.String({ description: 'ID of the source task output' }),
  sourceTaskId: t.String({ description: 'ID of the source task' }),
  targetInputId: t.String({ description: 'ID of the target task input' }),
  targetTaskId: t.String({ description: 'ID of the target task' })
});

// Parameter schemas
export const flowIdParamSchema = t.Object({
  id: t.String({ description: 'Unique identifier of the flow' })
});

export const flowExecutionIdParamSchema = t.Object({
  id: t.String({ description: 'Unique identifier of the flow execution' })
});

export const taskIdParamSchema = t.Object({
  id: t.String({ description: 'Unique identifier of the task' })
});
