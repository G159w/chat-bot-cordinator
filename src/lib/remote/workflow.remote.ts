import { command, query } from '$app/server';
import { Object, String } from '@sinclair/typebox';
import { Zod } from '@sinclair/typemap';

import { getServerApiClient } from '../server-api-client';

const executeWorkflowRequestSchema = Zod(
  Object({
    crewId: String({ description: 'ID of the crew to execute' }),
    input: String({ description: 'Input data for the workflow execution' })
  })
);

const workflowIdParamSchema = Zod(
  Object({
    id: String({ description: 'Unique identifier of the workflow execution' })
  })
);

export const executeWorkflow = command(executeWorkflowRequestSchema, async (data) => {
  const result = await getServerApiClient().api.workflows.execute.post(data);
  if (result.error) {
    throw new Error('Failed to execute workflow', { cause: result.error });
  }
  return result.data;
});

export const getWorkflowExecutionStatus = query(workflowIdParamSchema, async ({ id }) => {
  const result = await getServerApiClient().api.workflows({ id }).get();
  if (result.error) {
    throw new Error('Failed to get workflow execution status', { cause: result.error });
  }
  return result.data;
});

export const getWorkflowExecutionDetails = query(workflowIdParamSchema, async ({ id }) => {
  const result = await getServerApiClient().api.workflows({ id }).details.get();
  if (result.error) {
    throw new Error('Failed to get workflow execution details', { cause: result.error });
  }
  return result.data;
});
