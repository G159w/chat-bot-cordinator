import { inject, injectable } from '@needle-di/core';
import { t } from 'elysia';

import type { AuthGuardedApp } from '../api';

import {
	createCrewRequestSchema,
	crewIdParamSchema,
	crewListResponseSchema,
	crewResponseSchema,
	crewResponseUnionSchema,
	crewWithAgentsResponseUnionSchema,
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
					return this.crewService.listCrews(user.id);
				},
				{
					detail: {
						description:
							'Retrieves all crews (workflows) that belong to the authenticated user. Each crew contains a collection of agents that work together to execute tasks.',
						summary: 'List all crews for the authenticated user',
						tags: ['Crews']
					},
					response: crewListResponseSchema
				}
			)
			.get(
				'/crews/:id',
				async ({ params, user }) => {
					return this.crewService.getCrewById(params.id, user.id);
				},
				{
					detail: {
						description:
							'Retrieves a specific crew (workflow) by its ID. Returns null if the crew does not exist or does not belong to the authenticated user.',
						summary: 'Get a specific crew by ID',
						tags: ['Crews']
					},
					params: crewIdParamSchema,
					response: crewResponseUnionSchema
				}
			)
			.get(
				'/crews/:id/with-agents',
				async ({ params, user }) => {
					return this.crewService.getCrewWithAgents(params.id, user.id);
				},
				{
					detail: {
						description:
							'Retrieves a specific crew (workflow) along with all its associated agents. This endpoint provides a complete view of the crew structure including all agent details.',
						summary: 'Get a crew with all its agents',
						tags: ['Crews']
					},
					params: crewIdParamSchema,
					response: crewWithAgentsResponseUnionSchema
				}
			)
			.post(
				'/crews',
				async ({ body, user }) => {
					return this.crewService.createCrew(user.id, body);
				},
				{
					body: createCrewRequestSchema,
					detail: {
						description:
							'Creates a new crew (workflow) with optional agents. The crew will be associated with the authenticated user. Agents can be created as part of the crew creation process.',
						summary: 'Create a new crew',
						tags: ['Crews']
					},
					response: crewResponseSchema
				}
			)
			.put(
				'/crews/:id',
				async ({ body, params, user }) => {
					return this.crewService.updateCrew(params.id, user.id, body);
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
					response: crewResponseUnionSchema
				}
			)
			.delete(
				'/crews/:id',
				async ({ params, user }) => {
					return this.crewService.deleteCrew(params.id, user.id);
				},
				{
					detail: {
						description:
							'Deletes a crew (workflow) and all its associated agents. Only the crew owner can delete the crew. This action is irreversible.',
						summary: 'Delete a crew',
						tags: ['Crews']
					},
					params: crewIdParamSchema,
					response: t.Boolean()
				}
			);
	}
}
