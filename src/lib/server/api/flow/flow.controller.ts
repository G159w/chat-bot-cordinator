import { inject, injectable } from '@needle-di/core';
import { t } from 'elysia';

import type { AuthGuardedApp } from '../api';

import { crewIdParamSchema } from '../crew/crew.dto';
import { BadRequest, errorSchema, failShouldNotHappen, NotFound } from '../utils/exceptions';
import {
  createFlowRequestSchema,
  createTaskRequestSchema,
  executeFlowRequestSchema,
  executeFlowResponseSchema,
  flowExecutionIdParamSchema,
  flowExecutionResponseUnionSchema,
  flowExecutionWithDetailsResponseUnionSchema,
  flowIdParamSchema,
  flowResponseSchema,
  taskIdParamSchema,
  taskResponseSchema
} from './flow.dto';
import { FlowService } from './flow.service';

@injectable()
export class FlowController {
  constructor(private readonly flowService = inject(FlowService)) {
    this.getControllerApp = this.getControllerApp.bind(this);
  }

  getControllerApp(app: AuthGuardedApp) {
    return (
      app
        // Flow execution endpoints
        .post(
          '/flows/execute',
          async ({ body, user }) => {
            const result = await this.flowService.executeFlow(user.id, body);
            return result.match(
              (execution) => execution,
              (error) => {
                switch (error) {
                  case 'FLOW_NOT_FOUND':
                    throw NotFound('FLOW_NOT_FOUND');
                  case 'FLOW_INACTIVE':
                    throw BadRequest('FLOW_INACTIVE');
                  case 'NO_TASKS_FOUND_IN_FLOW':
                    throw BadRequest('NO_TASKS_FOUND_IN_FLOW');
                  default:
                    throw failShouldNotHappen();
                }
              }
            );
          },
          {
            body: executeFlowRequestSchema,
            detail: {
              description:
                'Executes a flow with all its tasks. This endpoint starts the flow execution and returns the execution ID for tracking.',
              summary: 'Execute a flow',
              tags: ['Flows']
            },
            response: {
              200: executeFlowResponseSchema,
              400: errorSchema('FLOW_INACTIVE'),
              404: errorSchema('FLOW_NOT_FOUND')
            }
          }
        )
        .get(
          '/flows/executions/:id',
          async ({ params, user }) => {
            const result = await this.flowService.getExecutionStatus(params.id, user.id);
            return result.match(
              (execution) => execution,
              (error) => {
                switch (error) {
                  case 'FLOW_EXECUTION_NOT_FOUND':
                    throw NotFound('FLOW_EXECUTION_NOT_FOUND');
                  default:
                    throw failShouldNotHappen();
                }
              }
            );
          },
          {
            detail: {
              description:
                'Retrieves the current status of a flow execution. Returns null if the execution does not exist or does not belong to the authenticated user.',
              summary: 'Get flow execution status',
              tags: ['Flows']
            },
            params: flowExecutionIdParamSchema,
            response: {
              200: flowExecutionResponseUnionSchema,
              404: errorSchema('FLOW_EXECUTION_NOT_FOUND')
            }
          }
        )
        .get(
          '/flows/executions/:id/details',
          async ({ params, user }) => {
            const result = await this.flowService.getExecutionWithDetails(params.id, user.id);
            return result.match(
              (details) => details,
              (error) => {
                switch (error) {
                  case 'FLOW_EXECUTION_NOT_FOUND':
                    throw NotFound('FLOW_EXECUTION_NOT_FOUND');
                  default:
                    throw failShouldNotHappen();
                }
              }
            );
          },
          {
            detail: {
              description:
                'Retrieves detailed information about a flow execution including all task interactions, inputs, outputs, and execution traces.',
              summary: 'Get flow execution details',
              tags: ['Flows']
            },
            params: flowExecutionIdParamSchema,
            response: {
              200: flowExecutionWithDetailsResponseUnionSchema,
              404: errorSchema('FLOW_EXECUTION_NOT_FOUND')
            }
          }
        )
        // Flow management endpoints
        .post(
          '/flows',
          async ({ body, user }) => {
            const result = await this.flowService.createFlow(user.id, body);
            return result.match(
              (flow) => flow,
              (error) => {
                switch (error) {
                  case 'CREW_NOT_FOUND':
                    throw NotFound('CREW_NOT_FOUND');
                  default:
                    throw failShouldNotHappen();
                }
              }
            );
          },
          {
            body: createFlowRequestSchema,
            detail: {
              description: 'Creates a new flow for a crew.',
              summary: 'Create a flow',
              tags: ['Flows']
            },
            response: {
              200: flowResponseSchema,
              404: errorSchema('CREW_NOT_FOUND')
            }
          }
        )
        .get(
          '/crews/:id/flows',
          async ({ params }) => {
            const flows = await this.flowService.getFlowsByCrewId(params.id);
            return flows;
          },
          {
            detail: {
              description: 'Retrieves all flows for a specific crew.',
              summary: 'Get flows by crew',
              tags: ['Flows']
            },
            params: crewIdParamSchema,
            response: {
              200: t.Array(flowResponseSchema)
            }
          }
        )
        .put(
          '/flows/:id',
          async ({ body, params, user }) => {
            const result = await this.flowService.updateFlow(params.id, user.id, body);
            return result.match(
              (flow) => flow,
              (error) => {
                switch (error) {
                  case 'FLOW_NOT_FOUND':
                    throw NotFound('FLOW_NOT_FOUND');
                  default:
                    throw failShouldNotHappen();
                }
              }
            );
          },
          {
            body: t.Object({
              description: t.Optional(t.String()),
              isActive: t.Optional(t.Boolean()),
              name: t.Optional(t.String())
            }),
            detail: {
              description: 'Updates an existing flow.',
              summary: 'Update a flow',
              tags: ['Flows']
            },
            params: flowIdParamSchema,
            response: {
              200: flowResponseSchema,
              404: errorSchema('FLOW_NOT_FOUND')
            }
          }
        )
        .delete(
          '/flows/:id',
          async ({ params, user }) => {
            const result = await this.flowService.deleteFlow(params.id, user.id);
            return result.match(
              () => ({ success: true }),
              (error) => {
                switch (error) {
                  case 'FLOW_NOT_FOUND':
                    throw NotFound('FLOW_NOT_FOUND');
                  default:
                    throw failShouldNotHappen();
                }
              }
            );
          },
          {
            detail: {
              description: 'Deletes a flow and all its associated tasks.',
              summary: 'Delete a flow',
              tags: ['Flows']
            },
            params: flowIdParamSchema,
            response: {
              200: t.Object({ success: t.Boolean() }),
              404: errorSchema('FLOW_NOT_FOUND')
            }
          }
        )
        // Task management endpoints
        .post(
          '/tasks',
          async ({ body, user }) => {
            const result = await this.flowService.createTask(user.id, body);
            return result.match(
              (task) => task,
              (error) => {
                switch (error) {
                  case 'FLOW_NOT_FOUND':
                    throw NotFound('FLOW_NOT_FOUND');
                  default:
                    throw failShouldNotHappen();
                }
              }
            );
          },
          {
            body: createTaskRequestSchema,
            detail: {
              description: 'Creates a new task for a flow.',
              summary: 'Create a task',
              tags: ['Tasks']
            },
            response: {
              200: taskResponseSchema,
              404: errorSchema('FLOW_NOT_FOUND')
            }
          }
        )
        .get(
          '/flows/:id/tasks',
          async ({ params, user }) => {
            const result = await this.flowService.getTasksByFlowId(params.id, user.id);
            return result.match(
              (tasks) => tasks,
              (error) => {
                switch (error) {
                  case 'FLOW_NOT_FOUND':
                    throw NotFound('FLOW_NOT_FOUND');
                  default:
                    throw failShouldNotHappen();
                }
              }
            );
          },
          {
            detail: {
              description: 'Retrieves all tasks for a specific flow.',
              summary: 'Get tasks by flow',
              tags: ['Tasks']
            },
            params: flowIdParamSchema,
            response: {
              200: t.Array(taskResponseSchema),
              404: errorSchema('FLOW_NOT_FOUND')
            }
          }
        )
        .put(
          '/tasks/:id',
          async ({ body, params }) => {
            const result = await this.flowService.updateTask(params.id, body);
            return result.match(
              (task) => task,
              (error) => {
                switch (error) {
                  case 'TASK_NOT_FOUND':
                    throw NotFound('TASK_NOT_FOUND');
                  default:
                    throw failShouldNotHappen();
                }
              }
            );
          },
          {
            body: t.Object({
              config: t.Optional(t.Record(t.String(), t.Any())),
              description: t.Optional(t.String()),
              name: t.Optional(t.String()),
              order: t.Optional(t.Number()),
              taskType: t.Optional(t.String())
            }),
            detail: {
              description: 'Updates an existing task.',
              summary: 'Update a task',
              tags: ['Tasks']
            },
            params: taskIdParamSchema,
            response: {
              200: taskResponseSchema,
              404: errorSchema('TASK_NOT_FOUND')
            }
          }
        )
        .delete(
          '/tasks/:id',
          async ({ params }) => {
            const result = await this.flowService.deleteTask(params.id);
            return result.match(
              () => ({ success: true }),
              (error) => {
                switch (error) {
                  case 'TASK_NOT_FOUND':
                    throw NotFound('TASK_NOT_FOUND');
                  default:
                    throw failShouldNotHappen();
                }
              }
            );
          },
          {
            detail: {
              description: 'Deletes a task.',
              summary: 'Delete a task',
              tags: ['Tasks']
            },
            params: taskIdParamSchema,
            response: {
              200: t.Object({ success: t.Boolean() }),
              404: errorSchema('TASK_NOT_FOUND')
            }
          }
        )
    );
  }
}
