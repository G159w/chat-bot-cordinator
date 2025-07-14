import { testingModule } from '$lib/server/test/setup';
import { describe, expect, it } from 'bun:test';

import { AgentService } from './agent.service';

describe('AgentService', () => {
  const { agentFactory, container, crewFactory, userFactory } = testingModule;
  const agentService = container.get(AgentService);

  describe('createAgent', () => {
    it('should create a basic agent successfully', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });

      const agentData = {
        crewId: createdCrew.id,
        description: 'A test agent',
        instructions: 'You are a helpful assistant',
        model: 'gpt-4',
        name: 'Test Agent',
        role: 'Assistant',
        temperature: 70
      };

      const result = await agentService.createAgent(agentData);

      expect(result).toBeDefined();
      expect(result.name).toBe(agentData.name);
      expect(result.role).toBe(agentData.role);
      expect(result.instructions).toBe(agentData.instructions);
      expect(result.model).toBe(agentData.model);
      expect(result.crewId).toBe(createdCrew.id);
      expect(result.description).toBe(agentData.description);
      expect(result.temperature).toBe(agentData.temperature);
      expect(result.isCoordinator).toBeNull();
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
    });

    it('should create a coordinator agent successfully', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });

      const agentData = {
        crewId: createdCrew.id,
        description: 'A coordinator agent',
        instructions: 'You coordinate the workflow',
        isCoordinator: true,
        model: 'gpt-4',
        name: 'Coordinator Agent',
        role: 'Coordinator',
        temperature: 50
      };

      const result = await agentService.createAgent(agentData);

      expect(result).toBeDefined();
      expect(result.name).toBe(agentData.name);
      expect(result.isCoordinator).toBe(true);
    });

    it('should throw error when creating second coordinator for same crew', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });

      // Create first coordinator
      await agentService.createAgent({
        crewId: createdCrew.id,
        instructions: 'You coordinate the workflow',
        isCoordinator: true,
        model: 'gpt-4',
        name: 'First Coordinator',
        role: 'Coordinator'
      });

      // Try to create second coordinator
      await expect(
        agentService.createAgent({
          crewId: createdCrew.id,
          instructions: 'You also coordinate the workflow',
          isCoordinator: true,
          model: 'gpt-4',
          name: 'Second Coordinator',
          role: 'Coordinator'
        })
      ).rejects.toThrow('Only one agent can be the coordinator per crew');
    });

    it('should create agent with tools', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });

      const agentData = {
        crewId: createdCrew.id,
        instructions: 'You have access to tools',
        model: 'gpt-4',
        name: 'Tool Agent',
        role: 'Tool User',
        tools: ['search', 'calculator', 'file_reader']
      };

      const result = await agentService.createAgent(agentData);

      expect(result).toBeDefined();
      expect(result.name).toBe(agentData.name);
      expect(result.tools).toEqual(agentData.tools);
    });

    it('should handle null values correctly', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });

      const agentData = {
        crewId: createdCrew.id,
        instructions: 'You are a helpful assistant',
        model: 'gpt-4',
        name: 'Test Agent',
        role: 'Assistant'
        // Intentionally omitting optional fields to test null handling
      };

      const result = await agentService.createAgent(agentData);

      expect(result).toBeDefined();
      expect(result.description).toBeNull();
      expect(result.isCoordinator).toBeNull();
      expect(result.order).toBeNull();
      expect(result.temperature).toBeNull();
      expect(result.tools).toBeNull();
    });
  });

  describe('listAgents', () => {
    it('should return all agents for a crew', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });

      // Create multiple agents
      await agentFactory.createBasicAgent({ crewId: createdCrew.id });
      await agentFactory.createBasicAgent({ crewId: createdCrew.id });
      await agentFactory.createBasicAgent({ crewId: createdCrew.id });

      const result = await agentService.listAgents(createdCrew.id);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      result.forEach((agent) => {
        expect(agent.crewId).toBe(createdCrew.id);
      });
    });

    it('should return empty array for crew with no agents', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });

      const result = await agentService.listAgents(createdCrew.id);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('getAgentById', () => {
    it('should return agent by id', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });
      const createdAgent = await agentFactory.createBasicAgent({
        crewId: createdCrew.id
      });

      const result = await agentService.getAgentById(createdAgent.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(createdAgent.id);
      expect(result?.name).toBe(createdAgent.name);
    });

    it('should return null for non-existent agent', async () => {
      const result = await agentService.getAgentById('00000000-0000-0000-0000-000000000000');

      expect(result).toBeNull();
    });
  });

  describe('getAgentsByCrewAndUser', () => {
    it('should return agents for crew owned by user', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });

      // Create agents for the crew
      await agentFactory.createBasicAgent({ crewId: createdCrew.id });
      await agentFactory.createBasicAgent({ crewId: createdCrew.id });

      const result = await agentService.getAgentsByCrewAndUser(createdCrew.id, createdUser.id);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      result.forEach((agent) => {
        expect(agent.crewId).toBe(createdCrew.id);
      });
    });

    it('should return empty array for crew not owned by user', async () => {
      const { createdUser: createUser1 } = await userFactory.createBasicUser();
      const { createdUser: createUser2 } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createUser1.id
      });

      // Create agents for the crew
      await agentFactory.createBasicAgent({ crewId: createdCrew.id });

      const result = await agentService.getAgentsByCrewAndUser(createdCrew.id, createUser2.id);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('updateAgent', () => {
    it('should update agent successfully', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });
      const createdAgent = await agentFactory.createBasicAgent({
        crewId: createdCrew.id
      });

      const updateData = {
        instructions: 'Updated instructions',
        name: 'Updated Agent Name',
        role: 'Updated Role',
        temperature: 80
      };

      const result = await agentService.updateAgent(createdAgent.id, updateData);

      expect(result).toBeDefined();
      expect(result?.name).toBe(updateData.name);
      expect(result?.role).toBe(updateData.role);
      expect(result?.instructions).toBe(updateData.instructions);
      expect(result?.temperature).toBe(updateData.temperature);
      // Unchanged fields should remain the same
      expect(result?.model).toBe(createdAgent.model);
      expect(result?.crewId).toBe(createdAgent.crewId);
    });

    it('should update agent to coordinator successfully', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });
      const createdAgent = await agentFactory.createBasicAgent({
        crewId: createdCrew.id,
        isCoordinator: false
      });

      const result = await agentService.updateAgent(createdAgent.id, {
        isCoordinator: true
      });

      expect(result).toBeDefined();
      expect(result?.isCoordinator).toBe(true);
    });

    it('should throw error when updating to coordinator when another coordinator exists', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });

      // Create first coordinator
      await agentFactory.createCoordinatorAgent({
        crewId: createdCrew.id
      });

      // Create second agent
      const secondAgent = await agentFactory.createBasicAgent({
        crewId: createdCrew.id,
        isCoordinator: false
      });

      // Try to update second agent to coordinator
      await expect(
        agentService.updateAgent(secondAgent.id, { isCoordinator: true })
      ).rejects.toThrow('Only one agent can be the coordinator per crew');
    });

    it('should return null for non-existent agent', async () => {
      const result = await agentService.updateAgent('00000000-0000-0000-0000-000000000000', {
        name: 'Updated Name'
      });

      expect(result).toBeNull();
    });

    it('should handle partial updates correctly', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });
      const createdAgent = await agentFactory.createBasicAgent({
        crewId: createdCrew.id,
        name: 'Original Name',
        role: 'Original Role',
        temperature: 70
      });

      // Update only name
      const result = await agentService.updateAgent(createdAgent.id, {
        name: 'Updated Name'
      });

      expect(result).toBeDefined();
      expect(result?.name).toBe('Updated Name');
      expect(result?.role).toBe('Original Role'); // Should remain unchanged
      expect(result?.temperature).toBe(70); // Should remain unchanged
    });

    it('should handle null values in updates', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });
      const createdAgent = await agentFactory.createBasicAgent({
        crewId: createdCrew.id,
        description: 'Original description',
        tools: ['original-tool']
      });

      // Test that we can update with empty values
      const result = await agentService.updateAgent(createdAgent.id, {
        description: '',
        tools: []
      });

      expect(result).toBeDefined();
      expect(result?.description).toBe('');
      expect(result?.tools).toEqual([]);
    });
  });

  describe('deleteAgent', () => {
    it('should delete agent successfully', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });
      const createdAgent = await agentFactory.createBasicAgent({
        crewId: createdCrew.id
      });

      const result = await agentService.deleteAgent(createdAgent.id);

      expect(result).toBe(true);

      // Verify agent is deleted
      const deletedAgent = await agentService.getAgentById(createdAgent.id);
      expect(deletedAgent).toBeNull();
    });

    it('should return false for non-existent agent', async () => {
      const result = await agentService.deleteAgent('00000000-0000-0000-0000-000000000000');

      expect(result).toBe(false);
    });
  });
});
