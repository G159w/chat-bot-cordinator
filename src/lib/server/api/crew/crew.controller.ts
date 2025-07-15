import { inject, injectable } from '@needle-di/core';
import { t } from 'elysia';

import type { AuthGuardedApp } from '../api';

import { BadRequest, errorSchema, failShouldNotHappen, NotFound } from '../utils/exceptions';
import {
  createCrewRequestSchema,
  crewIdParamSchema,
  crewListResponseSchema,
  crewResponseSchema,
  crewWithAgentsResponseSchema,
  updateCrewRequestSchema
} from './crew.dto';
import { CrewService } from './crew.service';

@injectable()
export class CrewController {
  constructor(private readonly crewService = inject(CrewService)) {
    this.getControllerApp = this.getControllerApp.bind(this);
  }

  getControllerApp(app: AuthGuardedApp) {
    return app
      .get(
        '/crews',
        async ({ user }) => {
          const result = await this.crewService.listCrews(user.id);
          return result.match(
            (crews) => crews,
            (error) => {
              switch (error) {
                default:
                  throw failShouldNotHappen();
              }
            }
          );
        },
        {
          detail: {
            description:
              'Retrieves all crews (workflows) that belong to the authenticated user. Each crew contains a collection of agents that work together to execute tasks.',
            summary: 'List all crews for the authenticated user',
            tags: ['Crews']
          },
          response: {
            200: crewListResponseSchema
          }
        }
      )
      .get(
        '/crews/:id',
        async ({ params, user }) => {
          const result = await this.crewService.getCrewById(params.id, user.id);
          return result.match(
            (crew) => crew,
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
              'Retrieves a specific crew (workflow) by its ID. Returns null if the crew does not exist or does not belong to the authenticated user.',
            summary: 'Get a specific crew by ID',
            tags: ['Crews']
          },
          params: crewIdParamSchema,
          response: {
            200: crewResponseSchema,
            404: errorSchema('CREW_NOT_FOUND')
          }
        }
      )
      .get(
        '/crews/:id/with-agents',
        async ({ params, user }) => {
          const result = await this.crewService.getCrewWithAgents(params.id, user.id);
          return result.match(
            (crew) => crew,
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
              'Retrieves a specific crew (workflow) along with all its associated agents. This endpoint provides a complete view of the crew structure including all agent details.',
            summary: 'Get a crew with all its agents',
            tags: ['Crews']
          },
          params: crewIdParamSchema,
          response: {
            200: crewWithAgentsResponseSchema,
            404: errorSchema('CREW_NOT_FOUND')
          }
        }
      )
      .post(
        '/crews',
        async ({ body, user }) => {
          const result = await this.crewService.createCrew(user.id, body);
          return result.match(
            (crew) => crew,
            (error) => {
              switch (error) {
                case 'ONLY_ONE_AGENT_CAN_BE_COORDINATOR':
                  throw BadRequest('ONLY_ONE_AGENT_CAN_BE_COORDINATOR');
                default:
                  throw failShouldNotHappen();
              }
            }
          );
        },
        {
          body: createCrewRequestSchema,
          detail: {
            description:
              'Creates a new crew (workflow) with optional agents. The crew will be associated with the authenticated user. Agents can be created as part of the crew creation process.',
            summary: 'Create a new crew',
            tags: ['Crews']
          },
          response: {
            200: crewResponseSchema,
            400: errorSchema('ONLY_ONE_AGENT_CAN_BE_COORDINATOR')
          }
        }
      )
      .put(
        '/crews/:id',
        async ({ body, params, user }) => {
          const result = await this.crewService.updateCrew(params.id, user.id, body);
          return result.match(
            (crew) => crew,
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
          body: updateCrewRequestSchema,
          detail: {
            description:
              'Updates an existing crew (workflow). Only the crew owner can update the crew. Partial updates are supported.',
            summary: 'Update a crew',
            tags: ['Crews']
          },
          params: crewIdParamSchema,
          response: {
            200: crewResponseSchema,
            404: errorSchema('CREW_NOT_FOUND')
          }
        }
      )
      .delete(
        '/crews/:id',
        async ({ params, user }) => {
          const result = await this.crewService.deleteCrew(params.id, user.id);
          return result.match(
            (success) => success,
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
          detail: {
            description:
              'Deletes a crew (workflow) and all its associated agents. Only the crew owner can delete the crew. This action is irreversible.',
            summary: 'Delete a crew',
            tags: ['Crews']
          },
          params: crewIdParamSchema,
          response: {
            200: t.Boolean(),
            404: errorSchema('CREW_NOT_FOUND')
          }
        }
      );
  }
}
