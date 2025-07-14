import { testingModule } from '$lib/server/test/setup';
import { describe, expect, it } from 'bun:test';

import { createAuthenticatedRequest } from '../../test/helpers';

describe('Agent Controller', () => {
	const { agentFactory, apiClient, crewFactory, userFactory } = testingModule;

	describe('GET /api/agents', () => {
		it('should return all agents for a crew', async () => {
			const { createdUser, userToken } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser.id
			});
			const _createdAgent = await agentFactory.createBasicAgent({
				crewId: createdCrew.id
			});

			const response = await apiClient.api.agents.get({
				...createAuthenticatedRequest({ userToken }),
				query: {
					crewId: createdCrew.id
				}
			});

			expect(response.status).toBe(200);
			expect(response.data).toBeDefined();
			expect(Array.isArray(response.data)).toBe(true);
			expect(response.data?.length).toBeGreaterThan(0);

			// Verify agent structure
			const responseAgent = response.data?.[0];
			expect(responseAgent).toHaveProperty('id');
			expect(responseAgent).toHaveProperty('name');
			expect(responseAgent).toHaveProperty('role');
			expect(responseAgent).toHaveProperty('instructions');
			expect(responseAgent).toHaveProperty('model');
			expect(responseAgent).toHaveProperty('crewId');
			expect(responseAgent).toHaveProperty('isCoordinator');
			expect(responseAgent).toHaveProperty('order');
			expect(responseAgent).toHaveProperty('temperature');
			expect(responseAgent).toHaveProperty('tools');
			expect(responseAgent).toHaveProperty('description');
			expect(responseAgent).toHaveProperty('createdAt');
		});

		it('should return empty array for crew with no agents', async () => {
			const { createdUser, userToken } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser.id
			});

			const response = await apiClient.api.agents.get({
				...createAuthenticatedRequest({ userToken }),
				query: {
					crewId: createdCrew.id
				}
			});

			expect(response.status).toBe(200);
			expect(response.data).toBeDefined();
			expect(Array.isArray(response.data)).toBe(true);
			expect(response.data?.length).toBe(0);
		});
	});

	describe('POST /api/agents', () => {
		it('should create a new agent', async () => {
			const { createdUser, userToken } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser.id
			});

			const newAgent = {
				crewId: createdCrew.id,
				description: 'A test agent',
				instructions: 'You are a helpful assistant',
				model: 'gpt-4',
				name: 'Test Agent',
				role: 'Assistant',
				temperature: 70
			};

			const response = await apiClient.api.agents.post(
				newAgent,
				createAuthenticatedRequest({ userToken })
			);

			expect(response.status).toBe(200);
			expect(response.data).toBeDefined();
			expect(response.data?.name).toBe(newAgent.name);
			expect(response.data?.role).toBe(newAgent.role);
			expect(response.data?.instructions).toBe(newAgent.instructions);
			expect(response.data?.model).toBe(newAgent.model);
			expect(response.data?.crewId).toBe(createdCrew.id);
			expect(response.data?.description).toBe(newAgent.description);
			expect(response.data?.temperature).toBe(newAgent.temperature);
			expect(response.data?.isCoordinator).toBeNull();
			expect(response.data?.id).toBeDefined();
			expect(response.data?.createdAt).toBeDefined();
		});

		it('should create a coordinator agent', async () => {
			const { createdUser, userToken } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser.id
			});

			const newAgent = {
				crewId: createdCrew.id,
				description: 'A coordinator agent',
				instructions: 'You coordinate the workflow',
				isCoordinator: true,
				model: 'gpt-4',
				name: 'Coordinator Agent',
				role: 'Coordinator',
				temperature: 50
			};

			const response = await apiClient.api.agents.post(
				newAgent,
				createAuthenticatedRequest({ userToken })
			);

			expect(response.status).toBe(200);
			expect(response.data).toBeDefined();
			expect(response.data?.name).toBe(newAgent.name);
			expect(response.data?.isCoordinator).toBe(true);
		});

		it('should return error when creating second coordinator', async () => {
			const { createdUser, userToken } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser.id
			});

			// Create first coordinator
			await apiClient.api.agents.post(
				{
					crewId: createdCrew.id,
					instructions: 'You coordinate the workflow',
					isCoordinator: true,
					model: 'gpt-4',
					name: 'First Coordinator',
					role: 'Coordinator'
				},
				createAuthenticatedRequest({ userToken })
			);

			// Try to create second coordinator
			const response = await apiClient.api.agents.post(
				{
					crewId: createdCrew.id,
					instructions: 'You also coordinate the workflow',
					isCoordinator: true,
					model: 'gpt-4',
					name: 'Second Coordinator',
					role: 'Coordinator'
				},
				createAuthenticatedRequest({ userToken })
			);

			expect(response.status).toBe(400);
			expect(response.error).toBeDefined();
			expect(response.error?.value.message).toBe('Only one agent can be the coordinator per crew');
		});

		it('should create agent with tools', async () => {
			const { createdUser, userToken } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser.id
			});

			const newAgent = {
				crewId: createdCrew.id,
				instructions: 'You have access to tools',
				model: 'gpt-4',
				name: 'Tool Agent',
				role: 'Tool User',
				tools: ['search', 'calculator', 'file_reader']
			};

			const response = await apiClient.api.agents.post(
				newAgent,
				createAuthenticatedRequest({ userToken })
			);

			expect(response.status).toBe(200);
			expect(response.data).toBeDefined();
			expect(response.data?.name).toBe(newAgent.name);
			expect(response.data?.tools).toEqual(newAgent.tools);
		});

		it('should return 401 for unauthenticated request', async () => {
			const newAgent = {
				instructions: 'You are a helpful assistant',
				model: 'gpt-4',
				name: 'Test Agent',
				role: 'Assistant'
			};

			const response = await apiClient.api.agents.post(
				newAgent,
				createAuthenticatedRequest({ userToken: 'test-user-123' })
			);

			console.log(JSON.stringify(response, null, 2));

			expect(response.status).toBe(401);
		});
	});
});
