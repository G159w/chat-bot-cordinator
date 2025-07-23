import { inject, injectable } from '@needle-di/core';
import { t } from 'elysia';

import type { AuthGuardedApp } from '../api';

import { BadRequest, errorSchema, failShouldNotHappen, NotFound } from '../utils/exceptions';
import {
  agentIdParamSchema,
  agentListQuerySchema,
  agentListResponseSchema,
  agentResponseSchema,
  createAgentRequestSchema,
  updateAgentRequestSchema
} from './agent.dto';
import { AgentService } from './agent.service';

@injectable()
export class AgentController {
  constructor(private readonly agentService = inject(AgentService)) {
    this.getControllerApp = this.getControllerApp.bind(this);
  }

  getControllerApp(app: AuthGuardedApp) {
    return app
      .get(
        '/agents',
        async ({ query, user }) => {
          const result = await this.agentService.listAgents(query.crewId, user.id);
          return result.match(
            (agents) => agents,
            (error) => {
              switch (error) {
                case 'CREW_NOT_FOUND':
                  throw NotFound('Crew not found');
                default:
                  throw failShouldNotHappen();
              }
            }
          );
        },
        {
          detail: {
            description:
              'Retrieves all agents for a specific crew. Returns agents ordered by their execution order in the workflow.',
            summary: 'List all agents for a crew',
            tags: ['Agents']
          },
          query: agentListQuerySchema,
          response: {
            200: agentListResponseSchema,
            404: errorSchema('CREW_NOT_FOUND')
          }
        }
      )
      .post(
        '/agents',
        async ({ body }) => {
          const result = await this.agentService.createAgent(body);
          return result.match(
            (agent) => agent,
            (error) => {
              switch (error) {
                case 'ONLY_ONE_AGENT_CAN_BE_COORDINATOR_PER_CREW':
                  throw BadRequest('ONLY_ONE_AGENT_CAN_BE_COORDINATOR_PER_CREW');
                default:
                  throw failShouldNotHappen();
              }
            }
          );
        },
        {
          body: createAgentRequestSchema,
          detail: {
            description:
              'Creates a new agent and adds it to the specified crew. The agent will be assigned the next available order number.',
            summary: 'Create a new agent',
            tags: ['Agents']
          },
          response: {
            200: agentResponseSchema,
            400: errorSchema('ONLY_ONE_AGENT_CAN_BE_COORDINATOR_PER_CREW')
          }
        }
      )
      .put(
        '/agents/:id',
        async ({ body, params }) => {
          const result = await this.agentService.updateAgent(params.id, body);
          return result.match(
            (agent) => agent,
            (error) => {
              switch (error) {
                case 'AGENT_NOT_FOUND':
                  throw NotFound('Agent not found');
                case 'ONLY_ONE_AGENT_CAN_BE_COORDINATOR_PER_CREW':
                  throw BadRequest('ONLY_ONE_AGENT_CAN_BE_COORDINATOR_PER_CREW');
                default:
                  throw failShouldNotHappen();
              }
            }
          );
        },
        {
          body: updateAgentRequestSchema,
          detail: {
            description: 'Updates an existing agent. Partial updates are supported.',
            summary: 'Update an agent',
            tags: ['Agents']
          },
          params: agentIdParamSchema,
          response: {
            200: agentResponseSchema,
            400: errorSchema('ONLY_ONE_AGENT_CAN_BE_COORDINATOR_PER_CREW'),
            404: errorSchema('AGENT_NOT_FOUND')
          }
        }
      )
      .delete(
        '/agents/:id',
        async ({ params, user }) => {
          const result = await this.agentService.deleteAgent(params.id, user.id);
          return result.match(
            (success) => success,
            (error) => {
              switch (error) {
                case 'AGENT_NOT_FOUND':
                  throw NotFound('Agent not found');
                default:
                  throw failShouldNotHappen();
              }
            }
          );
        },
        {
          detail: {
            description: 'Deletes an existing agent.',
            summary: 'Delete an agent',
            tags: ['Agents']
          },
          params: agentIdParamSchema,
          response: {
            200: t.Boolean(),
            404: errorSchema('AGENT_NOT_FOUND')
          }
        }
      );
  }
}
