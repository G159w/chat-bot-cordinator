import { testingModule } from '$lib/server/test/setup';
import { describe, expect, it } from 'bun:test';

import { CrewService } from './crew.service';

describe('CrewService', () => {
	const { agentFactory, container, crewFactory, userFactory } = testingModule;
	const crewService = container.get(CrewService);

	describe('createCrew', () => {
		it('should create a crew without agents successfully', async () => {
			const { createdUser } = await userFactory.createBasicUser();

			const crewData = {
				description: 'A test crew',
				name: 'Test Crew'
			};

			const result = await crewService.createCrew(createdUser.id, crewData);

			expect(result).toBeDefined();
			expect(result.name).toBe(crewData.name);
			expect(result.description).toBe(crewData.description);
			expect(result.userId).toBe(createdUser.id);
			expect(result.id).toBeDefined();
			expect(result.createdAt).toBeDefined();
			expect(result.updatedAt).toBeDefined();
			expect(result.isActive).toBe(true);
		});

		it('should create a crew with agents successfully', async () => {
			const { createdUser } = await userFactory.createBasicUser();

			const crewData = {
				agents: [
					{
						description: 'A coordinator agent',
						instructions: 'You coordinate the workflow',
						isCoordinator: true,
						model: 'gpt-4',
						name: 'Coordinator Agent',
						role: 'Coordinator',
						temperature: 50
					},
					{
						description: 'A research agent',
						instructions: 'You research topics',
						model: 'gpt-4',
						name: 'Research Agent',
						role: 'Researcher',
						temperature: 70
					}
				],
				description: 'A test crew with agents',
				name: 'Test Crew with Agents'
			};

			const result = await crewService.createCrew(createdUser.id, crewData);

			expect(result).toBeDefined();
			expect(result.name).toBe(crewData.name);
			expect(result.description).toBe(crewData.description);
			expect(result.userId).toBe(createdUser.id);

			// Verify agents were created
			const agents = await crewService.getCrewAgents(result.id, createdUser.id);
			expect(agents).toHaveLength(2);
			expect(agents[0].isCoordinator).toBe(true);
			expect(agents[1].isCoordinator).toBeNull();
		});

		it('should throw error when creating crew with multiple coordinators', async () => {
			const { createdUser } = await userFactory.createBasicUser();

			const crewData = {
				agents: [
					{
						instructions: 'You coordinate the workflow',
						isCoordinator: true,
						model: 'gpt-4',
						name: 'First Coordinator',
						role: 'Coordinator'
					},
					{
						instructions: 'You also coordinate the workflow',
						isCoordinator: true,
						model: 'gpt-4',
						name: 'Second Coordinator',
						role: 'Coordinator'
					}
				],
				name: 'Test Crew with Multiple Coordinators'
			};

			await expect(crewService.createCrew(createdUser.id, crewData)).rejects.toThrow(
				'Only one agent can be the coordinator'
			);
		});

		it('should create crew with agents having null values', async () => {
			const { createdUser } = await userFactory.createBasicUser();

			const crewData = {
				agents: [
					{
						instructions: 'You are a helpful assistant',
						model: 'gpt-4',
						name: 'Test Agent',
						role: 'Assistant'
						// Intentionally omitting optional fields
					}
				],
				name: 'Test Crew with Null Values'
			};

			const result = await crewService.createCrew(createdUser.id, crewData);

			expect(result).toBeDefined();
			expect(result.name).toBe(crewData.name);

			// Verify agent was created with null values
			const agents = await crewService.getCrewAgents(result.id, createdUser.id);
			expect(agents).toHaveLength(1);
			expect(agents[0].description).toBeNull();
			expect(agents[0].isCoordinator).toBeNull();
			expect(agents[0].order).toBe(0);
			expect(agents[0].temperature).toBeNull();
			expect(agents[0].tools).toBeNull();
		});
	});

	describe('listCrews', () => {
		it('should return all crews for a user', async () => {
			const { createdUser } = await userFactory.createBasicUser();

			// Create multiple crews
			await crewFactory.createBasicCrew({ userId: createdUser.id });
			await crewFactory.createBasicCrew({ userId: createdUser.id });
			await crewFactory.createBasicCrew({ userId: createdUser.id });

			const result = await crewService.listCrews(createdUser.id);

			expect(result).toBeDefined();
			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThanOrEqual(3);
			result.forEach((crew) => {
				expect(crew.userId).toBe(createdUser.id);
			});
		});

		it('should return empty array for user with no crews', async () => {
			const { createdUser } = await userFactory.createBasicUser();

			const result = await crewService.listCrews(createdUser.id);

			expect(result).toBeDefined();
			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBe(0);
		});
	});

	describe('getCrewById', () => {
		it('should return crew by id for owner', async () => {
			const { createdUser } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser.id
			});

			const result = await crewService.getCrewById(createdCrew.id, createdUser.id);

			expect(result).toBeDefined();
			expect(result.id).toBe(createdCrew.id);
			expect(result.name).toBe(createdCrew.name);
			expect(result.userId).toBe(createdUser.id);
		});

		it('should throw error for non-existent crew', async () => {
			const { createdUser } = await userFactory.createBasicUser();

			await expect(
				crewService.getCrewById('00000000-0000-0000-0000-000000000000', createdUser.id)
			).rejects.toThrow('Crew not found');
		});

		it('should throw error for crew not owned by user', async () => {
			const { createdUser: createdUser1 } = await userFactory.createBasicUser();
			const { createdUser: createdUser2 } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser1.id
			});

			await expect(crewService.getCrewById(createdCrew.id, createdUser2.id)).rejects.toThrow(
				'Crew not found'
			);
		});
	});

	describe('getCrewWithAgents', () => {
		it('should return crew with agents for owner', async () => {
			const { createdUser } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser.id
			});

			// Add agents to crew
			await agentFactory.createBasicAgent({ crewId: createdCrew.id });
			await agentFactory.createBasicAgent({ crewId: createdCrew.id });

			const result = await crewService.getCrewWithAgents(createdCrew.id, createdUser.id);

			expect(result).toBeDefined();
			expect(result?.crew.id).toBe(createdCrew.id);
			expect(result?.crew.userId).toBe(createdUser.id);
			expect(result?.agents).toHaveLength(2);
			result?.agents.forEach((agent) => {
				expect(agent.crewId).toBe(createdCrew.id);
			});
		});

		it('should throw error for non-existent crew', async () => {
			const { createdUser } = await userFactory.createBasicUser();

			await expect(
				crewService.getCrewWithAgents('00000000-0000-0000-0000-000000000000', createdUser.id)
			).rejects.toThrow('Crew not found');
		});

		it('should throw error for crew not owned by user', async () => {
			const { createdUser: createdUser1 } = await userFactory.createBasicUser();
			const { createdUser: createdUser2 } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser1.id
			});

			await expect(crewService.getCrewWithAgents(createdCrew.id, createdUser2.id)).rejects.toThrow(
				'Crew not found'
			);
		});
	});

	describe('getCrewAgents', () => {
		it('should return agents for crew owned by user', async () => {
			const { createdUser } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser.id
			});

			// Add agents to crew
			await agentFactory.createBasicAgent({ crewId: createdCrew.id });
			await agentFactory.createBasicAgent({ crewId: createdCrew.id });

			const result = await crewService.getCrewAgents(createdCrew.id, createdUser.id);

			expect(result).toBeDefined();
			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBe(2);
			result.forEach((agent) => {
				expect(agent.crewId).toBe(createdCrew.id);
			});
		});

		it('should throw error for crew not owned by user', async () => {
			const { createdUser: createdUser1 } = await userFactory.createBasicUser();
			const { createdUser: createdUser2 } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser1.id
			});

			await expect(crewService.getCrewAgents(createdCrew.id, createdUser2.id)).rejects.toThrow(
				'Crew not found'
			);
		});

		it('should throw error for non-existent crew', async () => {
			const { createdUser } = await userFactory.createBasicUser();

			await expect(
				crewService.getCrewAgents('00000000-0000-0000-0000-000000000000', createdUser.id)
			).rejects.toThrow('Crew not found');
		});
	});

	describe('addAgentToCrew', () => {
		it('should add agent to crew successfully', async () => {
			const { createdUser } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser.id
			});

			const agentData = {
				description: 'A test agent',
				instructions: 'You are a helpful assistant',
				model: 'gpt-4',
				name: 'Test Agent',
				role: 'Assistant',
				temperature: 70
			};

			const result = await crewService.addAgentToCrew(createdCrew.id, createdUser.id, agentData);

			expect(result).toBeDefined();
			expect(result.name).toBe(agentData.name);
			expect(result.role).toBe(agentData.role);
			expect(result.instructions).toBe(agentData.instructions);
			expect(result.model).toBe(agentData.model);
			expect(result.crewId).toBe(createdCrew.id);
			expect(result.description).toBe(agentData.description);
			expect(result.temperature).toBe(agentData.temperature);
			expect(result.order).toBe(0); // First agent should have order 0
		});

		it('should add multiple agents with correct order', async () => {
			const { createdUser } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser.id
			});

			const agentData1 = {
				instructions: 'You are a helpful assistant',
				model: 'gpt-4',
				name: 'First Agent',
				role: 'Assistant'
			};

			const agentData2 = {
				instructions: 'You are a researcher',
				model: 'gpt-4',
				name: 'Second Agent',
				role: 'Researcher'
			};

			const result1 = await crewService.addAgentToCrew(createdCrew.id, createdUser.id, agentData1);
			const result2 = await crewService.addAgentToCrew(createdCrew.id, createdUser.id, agentData2);

			expect(result1.order).toBe(0);
			expect(result2.order).toBe(1);
		});

		it('should throw error for crew not owned by user', async () => {
			const { createdUser: createdUser1 } = await userFactory.createBasicUser();
			const { createdUser: createdUser2 } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser1.id
			});

			const agentData = {
				instructions: 'You are a helpful assistant',
				model: 'gpt-4',
				name: 'Test Agent',
				role: 'Assistant'
			};

			await expect(
				crewService.addAgentToCrew(createdCrew.id, createdUser2.id, agentData)
			).rejects.toThrow('Crew not found or access denied');
		});

		it('should throw error for non-existent crew', async () => {
			const { createdUser } = await userFactory.createBasicUser();

			const agentData = {
				instructions: 'You are a helpful assistant',
				model: 'gpt-4',
				name: 'Test Agent',
				role: 'Assistant'
			};

			await expect(
				crewService.addAgentToCrew(
					'00000000-0000-0000-0000-000000000000',
					createdUser.id,
					agentData
				)
			).rejects.toThrow('Crew not found or access denied');
		});
	});

	describe('updateCrew', () => {
		it('should update crew successfully', async () => {
			const { createdUser } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser.id
			});

			const updateData = {
				description: 'Updated description',
				name: 'Updated Crew Name'
			};

			const result = await crewService.updateCrew(createdCrew.id, createdUser.id, updateData);

			expect(result).toBeDefined();
			expect(result?.name).toBe(updateData.name);
			expect(result?.description).toBe(updateData.description);
			// Unchanged fields should remain the same
			expect(result?.userId).toBe(createdCrew.userId);
			expect(result?.isActive).toBe(createdCrew.isActive);
		});

		it('should update crew isActive status', async () => {
			const { createdUser } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser.id
			});

			const result = await crewService.updateCrew(createdCrew.id, createdUser.id, {
				isActive: false
			});

			expect(result).toBeDefined();
			expect(result?.isActive).toBe(false);
		});

		it('should handle partial updates correctly', async () => {
			const { createdUser } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser.id
			});

			// Update only name
			const result = await crewService.updateCrew(createdCrew.id, createdUser.id, {
				name: 'Updated Name'
			});

			expect(result).toBeDefined();
			expect(result?.name).toBe('Updated Name');
			expect(result?.description).toBe(createdCrew.description); // Should remain unchanged
		});

		it('should throw error for crew not owned by user', async () => {
			const { createdUser: createdUser1 } = await userFactory.createBasicUser();
			const { createdUser: createdUser2 } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser1.id
			});

			await expect(
				crewService.updateCrew(createdCrew.id, createdUser2.id, {
					name: 'Updated Name'
				})
			).rejects.toThrow('Crew not found');
		});

		it('should throw error for non-existent crew', async () => {
			const { createdUser } = await userFactory.createBasicUser();

			await expect(
				crewService.updateCrew('00000000-0000-0000-0000-000000000000', createdUser.id, {
					name: 'Updated Name'
				})
			).rejects.toThrow('Crew not found');
		});
	});

	describe('updateAgentOrder', () => {
		it('should update agent order successfully', async () => {
			const { createdUser } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser.id
			});

			// Create agents
			const agent1 = await agentFactory.createBasicAgent({ crewId: createdCrew.id, order: 0 });
			const agent2 = await agentFactory.createBasicAgent({ crewId: createdCrew.id, order: 1 });

			const agentOrders = [
				{ id: agent1.id, order: 1 },
				{ id: agent2.id, order: 0 }
			];

			await crewService.updateAgentOrder(createdCrew.id, createdUser.id, agentOrders);

			// Verify order was updated
			const agents = await crewService.getCrewAgents(createdCrew.id, createdUser.id);
			expect(agents).toHaveLength(2);

			const updatedAgent1 = agents.find((a) => a.id === agent1.id);
			const updatedAgent2 = agents.find((a) => a.id === agent2.id);
			expect(updatedAgent1?.order).toBe(1);
			expect(updatedAgent2?.order).toBe(0);
		});

		it('should throw error for crew not owned by user', async () => {
			const { createdUser: createdUser1 } = await userFactory.createBasicUser();
			const { createdUser: createdUser2 } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser1.id
			});

			await expect(
				crewService.updateAgentOrder(createdCrew.id, createdUser2.id, [])
			).rejects.toThrow('Crew not found or access denied');
		});
	});

	describe('deleteCrew', () => {
		it('should delete crew successfully', async () => {
			const { createdUser } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser.id
			});

			const result = await crewService.deleteCrew(createdCrew.id, createdUser.id);

			expect(result).toBe(true);

			// Verify crew is deleted
			await expect(crewService.getCrewById(createdCrew.id, createdUser.id)).rejects.toThrow(
				'Crew not found'
			);
		});

		it('should throw error for crew not owned by user', async () => {
			const { createdUser: createdUser1 } = await userFactory.createBasicUser();
			const { createdUser: createdUser2 } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser1.id
			});

			await expect(crewService.deleteCrew(createdCrew.id, createdUser2.id)).rejects.toThrow(
				'Crew not found'
			);
		});

		it('should throw error for non-existent crew', async () => {
			const { createdUser } = await userFactory.createBasicUser();

			await expect(
				crewService.deleteCrew('00000000-0000-0000-0000-000000000000', createdUser.id)
			).rejects.toThrow('Crew not found');
		});
	});
});
