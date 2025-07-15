import { inject, injectable } from '@needle-di/core';

import type { AuthGuardedApp } from '../api';

import { BadRequest, errorSchema, failShouldNotHappen, NotFound } from '../utils/exceptions';
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
          const result = await this.workflowService.executeWorkflow(user.id, body);
          return result.match(
            (execution) => execution,
            (error) => {
              switch (error) {
                case 'INPUT_REQUIRED':
                  throw BadRequest('INPUT_REQUIRED');
                case 'CREW_NOT_FOUND':
                  throw NotFound('CREW_NOT_FOUND');
                case 'NO_AGENTS_FOUND_IN_CREW':
                  throw BadRequest('NO_AGENTS_FOUND_IN_CREW');
                default:
                  throw failShouldNotHappen();
              }
            }
          );
        },
        {
          body: executeWorkflowRequestSchema,
          detail: {
            description:
              'Executes a workflow (crew) with all its agents. This endpoint starts the workflow execution and returns the execution ID for tracking.',
            summary: 'Execute a workflow',
            tags: ['Workflows']
          },
          response: {
            200: executeWorkflowResponseSchema,
            400: errorSchema('INPUT_REQUIRED'),
            404: errorSchema('CREW_NOT_FOUND')
          }
        }
      )
      .get(
        '/workflows/:id',
        async ({ params, user }) => {
          const result = await this.workflowService.getExecutionStatus(params.id, user.id);
          return result.match(
            (execution) => execution,
            (error) => {
              switch (error) {
                case 'WORKFLOW_EXECUTION_NOT_FOUND':
                  throw NotFound('WORKFLOW_EXECUTION_NOT_FOUND');
                default:
                  throw failShouldNotHappen();
              }
            }
          );
        },
        {
          detail: {
            description:
              'Retrieves the current status of a workflow execution. Returns null if the execution does not exist or does not belong to the authenticated user.',
            summary: 'Get workflow execution status',
            tags: ['Workflows']
          },
          params: workflowIdParamSchema,
          response: {
            200: workflowExecutionResponseUnionSchema,
            404: errorSchema('WORKFLOW_EXECUTION_NOT_FOUND')
          }
        }
      )
      .get(
        '/workflows/:id/details',
        async ({ params, user }) => {
          const result = await this.workflowService.getExecutionWithDetails(params.id, user.id);
          return result.match(
            (details) => details,
            (error) => {
              switch (error) {
                case 'WORKFLOW_EXECUTION_NOT_FOUND':
                  throw NotFound('WORKFLOW_EXECUTION_NOT_FOUND');
                default:
                  throw failShouldNotHappen();
              }
            }
          );
        },
        {
          detail: {
            description:
              'Retrieves detailed information about a workflow execution including all agent interactions, inputs, outputs, and execution traces.',
            summary: 'Get workflow execution details',
            tags: ['Workflows']
          },
          params: workflowIdParamSchema,
          response: {
            200: workflowExecutionWithDetailsResponseUnionSchema,
            404: errorSchema('WORKFLOW_EXECUTION_NOT_FOUND')
          }
        }
      );
  }
}
