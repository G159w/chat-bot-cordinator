import type { Agent, Crew } from '$lib/server/db/schema';

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
      const crew = result._unsafeUnwrap();

      expect(crew).toBeDefined();
      expect(crew.name).toBe(crewData.name);
      expect(crew.description).toBe(crewData.description);
      expect(crew.userId).toBe(createdUser.id);
      expect(crew.id).toBeDefined();
      expect(crew.createdAt).toBeDefined();
      expect(crew.updatedAt).toBeDefined();
      expect(crew.isActive).toBe(true);
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
      const crew = result._unsafeUnwrap();

      expect(crew).toBeDefined();
      expect(crew.name).toBe(crewData.name);
      expect(crew.description).toBe(crewData.description);
      expect(crew.userId).toBe(createdUser.id);

      // Verify agents were created
      const agentsResult = await crewService.getCrewAgents(crew.id, createdUser.id);
      const agents = agentsResult._unsafeUnwrap();
      expect(agents).toHaveLength(2);
      expect(agents[0].isCoordinator).toBe(true);
      expect(agents[1].isCoordinator).toBeNull();
    });

    it('should return error when creating crew with multiple coordinators', async () => {
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

      const result = await crewService.createCrew(createdUser.id, crewData);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('ONLY_ONE_AGENT_CAN_BE_COORDINATOR');
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
      const crew = result._unsafeUnwrap();

      expect(crew).toBeDefined();
      expect(crew.name).toBe(crewData.name);

      // Verify agent was created with null values
      const agentsResult = await crewService.getCrewAgents(crew.id, createdUser.id);
      const agents = agentsResult._unsafeUnwrap();
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
      const crews = result._unsafeUnwrap();

      expect(crews).toBeDefined();
      expect(Array.isArray(crews)).toBe(true);
      expect(crews.length).toBeGreaterThanOrEqual(3);
      crews.forEach((crew: Crew) => {
        expect(crew.userId).toBe(createdUser.id);
      });
    });

    it('should return empty array for user with no crews', async () => {
      const { createdUser } = await userFactory.createBasicUser();

      const result = await crewService.listCrews(createdUser.id);
      const crews = result._unsafeUnwrap();

      expect(crews).toBeDefined();
      expect(Array.isArray(crews)).toBe(true);
      expect(crews.length).toBe(0);
    });
  });

  describe('getCrewById', () => {
    it('should return crew by id for owner', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });

      const result = await crewService.getCrewById(createdCrew.id, createdUser.id);
      const crew = result._unsafeUnwrap();

      expect(crew).toBeDefined();
      expect(crew.id).toBe(createdCrew.id);
      expect(crew.name).toBe(createdCrew.name);
      expect(crew.userId).toBe(createdUser.id);
    });

    it('should return error for non-existent crew', async () => {
      const { createdUser } = await userFactory.createBasicUser();

      const result = await crewService.getCrewById(
        '00000000-0000-0000-0000-000000000000',
        createdUser.id
      );
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('CREW_NOT_FOUND');
    });

    it('should return error for crew not owned by user', async () => {
      const { createdUser: createdUser1 } = await userFactory.createBasicUser();
      const { createdUser: createdUser2 } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser1.id
      });

      const result = await crewService.getCrewById(createdCrew.id, createdUser2.id);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('CREW_NOT_FOUND');
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
      const crewWithAgents = result._unsafeUnwrap();

      expect(crewWithAgents).toBeDefined();
      expect(crewWithAgents?.id).toBe(createdCrew.id);
      expect(crewWithAgents?.userId).toBe(createdUser.id);
      expect(crewWithAgents?.agents).toHaveLength(2);
      crewWithAgents?.agents.forEach((agent: Agent) => {
        expect(agent.crewId).toBe(createdCrew.id);
      });
    });

    it('should return error for non-existent crew', async () => {
      const { createdUser } = await userFactory.createBasicUser();

      const result = await crewService.getCrewWithAgents(
        '00000000-0000-0000-0000-000000000000',
        createdUser.id
      );
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('CREW_NOT_FOUND');
    });

    it('should return error for crew not owned by user', async () => {
      const { createdUser: createdUser1 } = await userFactory.createBasicUser();
      const { createdUser: createdUser2 } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser1.id
      });

      const result = await crewService.getCrewWithAgents(createdCrew.id, createdUser2.id);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('CREW_NOT_FOUND');
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
      const agents = result._unsafeUnwrap();

      expect(agents).toBeDefined();
      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBe(2);
      agents.forEach((agent: Agent) => {
        expect(agent.crewId).toBe(createdCrew.id);
      });
    });

    it('should return error for crew not owned by user', async () => {
      const { createdUser: createdUser1 } = await userFactory.createBasicUser();
      const { createdUser: createdUser2 } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser1.id
      });

      const result = await crewService.getCrewAgents(createdCrew.id, createdUser2.id);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('CREW_NOT_FOUND');
    });

    it('should return error for non-existent crew', async () => {
      const { createdUser } = await userFactory.createBasicUser();

      const result = await crewService.getCrewAgents(
        '00000000-0000-0000-0000-000000000000',
        createdUser.id
      );
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('CREW_NOT_FOUND');
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
      const agent = result._unsafeUnwrap();

      expect(agent).toBeDefined();
      expect(agent.name).toBe(agentData.name);
      expect(agent.role).toBe(agentData.role);
      expect(agent.instructions).toBe(agentData.instructions);
      expect(agent.model).toBe(agentData.model);
      expect(agent.crewId).toBe(createdCrew.id);
      expect(agent.description).toBe(agentData.description);
      expect(agent.temperature).toBe(agentData.temperature);
      expect(agent.order).toBe(0); // First agent should have order 0
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
      const agent1 = result1._unsafeUnwrap();
      const agent2 = result2._unsafeUnwrap();

      expect(agent1.order).toBe(0);
      expect(agent2.order).toBe(1);
    });

    it('should return error for crew not owned by user', async () => {
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

      const result = await crewService.addAgentToCrew(createdCrew.id, createdUser2.id, agentData);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('CREW_NOT_FOUND_OR_ACCESS_DENIED');
    });

    it('should return error for non-existent crew', async () => {
      const { createdUser } = await userFactory.createBasicUser();

      const agentData = {
        instructions: 'You are a helpful assistant',
        model: 'gpt-4',
        name: 'Test Agent',
        role: 'Assistant'
      };

      const result = await crewService.addAgentToCrew(
        '00000000-0000-0000-0000-000000000000',
        createdUser.id,
        agentData
      );
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('CREW_NOT_FOUND_OR_ACCESS_DENIED');
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
      const crew = result._unsafeUnwrap();

      expect(crew).toBeDefined();
      expect(crew?.name).toBe(updateData.name);
      expect(crew?.description).toBe(updateData.description);
      // Unchanged fields should remain the same
      expect(crew?.userId).toBe(createdCrew.userId);
      expect(crew?.isActive).toBe(createdCrew.isActive);
    });

    it('should update crew isActive status', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });

      const result = await crewService.updateCrew(createdCrew.id, createdUser.id, {
        isActive: false
      });
      const crew = result._unsafeUnwrap();

      expect(crew).toBeDefined();
      expect(crew?.isActive).toBe(false);
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
      const crew = result._unsafeUnwrap();

      expect(crew).toBeDefined();
      expect(crew?.name).toBe('Updated Name');
      expect(crew?.description).toBe(createdCrew.description); // Should remain unchanged
    });

    it('should return error for crew not owned by user', async () => {
      const { createdUser: createdUser1 } = await userFactory.createBasicUser();
      const { createdUser: createdUser2 } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser1.id
      });

      const result = await crewService.updateCrew(createdCrew.id, createdUser2.id, {
        name: 'Updated Name'
      });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('CREW_NOT_FOUND');
    });

    it('should return error for non-existent crew', async () => {
      const { createdUser } = await userFactory.createBasicUser();

      const result = await crewService.updateCrew(
        '00000000-0000-0000-0000-000000000000',
        createdUser.id,
        {
          name: 'Updated Name'
        }
      );
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('CREW_NOT_FOUND');
    });
  });

  describe('deleteCrew', () => {
    it('should delete crew successfully', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });

      const result = await crewService.deleteCrew(createdCrew.id, createdUser.id);
      const success = result._unsafeUnwrap();

      expect(success).toBe(true);

      // Verify crew is deleted
      const getResult = await crewService.getCrewById(createdCrew.id, createdUser.id);
      expect(getResult.isErr()).toBe(true);
      expect(getResult._unsafeUnwrapErr()).toBe('CREW_NOT_FOUND');
    });

    it('should return error for crew not owned by user', async () => {
      const { createdUser: createdUser1 } = await userFactory.createBasicUser();
      const { createdUser: createdUser2 } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser1.id
      });

      const result = await crewService.deleteCrew(createdCrew.id, createdUser2.id);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('CREW_NOT_FOUND');
    });

    it('should return error for non-existent crew', async () => {
      const { createdUser } = await userFactory.createBasicUser();

      const result = await crewService.deleteCrew(
        '00000000-0000-0000-0000-000000000000',
        createdUser.id
      );
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('CREW_NOT_FOUND');
    });
  });
});
