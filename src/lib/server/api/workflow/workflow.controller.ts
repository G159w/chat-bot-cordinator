import { inject, injectable } from '@needle-di/core';

import type { AuthGuardedApp } from '../api';

import {
	executeWorkflowRequestSchema,
	executeWorkflowResponseSchema,
	workflowExecutionResponseUnionSchema,
	workflowExecutionWithDetailsResponseUnionSchema,
	workflowIdParamSchema
} from './workflow.dto';
import { WorkflowService } from './workflow.service';

@injectable()
export class WorkflowController {
	constructor(private readonly workflowService = inject(WorkflowService)) {
		this.getControllerApp = this.getControllerApp.bind(this);
	}

	getControllerApp(app: AuthGuardedApp) {
		return app
			.post(
				'/workflows/execute',
				async ({ body, user }) => {
					return this.workflowService.executeWorkflow(user.id, body);
				},
				{
					body: executeWorkflowRequestSchema,
					detail: {
						description:
							'Executes a workflow (crew) with all its agents. This endpoint starts the workflow execution and returns the execution ID for tracking.',
						summary: 'Execute a workflow',
						tags: ['Workflows']
					},
					response: executeWorkflowResponseSchema
				}
			)
			.get(
				'/workflows/:id',
				async ({ params, user }) => {
					return this.workflowService.getExecutionStatus(params.id, user.id);
				},
				{
					detail: {
						description:
							'Retrieves the current status of a workflow execution. Returns null if the execution does not exist or does not belong to the authenticated user.',
						summary: 'Get workflow execution status',
						tags: ['Workflows']
					},
					params: workflowIdParamSchema,
					response: workflowExecutionResponseUnionSchema
				}
			)
			.get(
				'/workflows/:id/details',
				async ({ params, user }) => {
					return this.workflowService.getExecutionWithDetails(params.id, user.id);
				},
				{
					detail: {
						description:
							'Retrieves detailed information about a workflow execution including all agent interactions, inputs, outputs, and execution traces.',
						summary: 'Get workflow execution details',
						tags: ['Workflows']
					},
					params: workflowIdParamSchema,
					response: workflowExecutionWithDetailsResponseUnionSchema
				}
			);
	}
}
