import type { Agent } from '$lib/server/db/schema';

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
      const agent = result._unsafeUnwrap();

      expect(agent).toBeDefined();
      expect(agent.name).toBe(agentData.name);
      expect(agent.role).toBe(agentData.role);
      expect(agent.instructions).toBe(agentData.instructions);
      expect(agent.model).toBe(agentData.model);
      expect(agent.crewId).toBe(createdCrew.id);
      expect(agent.description).toBe(agentData.description);
      expect(agent.temperature).toBe(agentData.temperature);
      expect(agent.isCoordinator).toBeNull();
      expect(agent.id).toBeDefined();
      expect(agent.createdAt).toBeDefined();
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
      const agent = result._unsafeUnwrap();

      expect(agent).toBeDefined();
      expect(agent.name).toBe(agentData.name);
      expect(agent.isCoordinator).toBe(true);
    });

    it('should return error when creating second coordinator for same crew', async () => {
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
      const result = await agentService.createAgent({
        crewId: createdCrew.id,
        instructions: 'You also coordinate the workflow',
        isCoordinator: true,
        model: 'gpt-4',
        name: 'Second Coordinator',
        role: 'Coordinator'
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('ONLY_ONE_AGENT_CAN_BE_COORDINATOR_PER_CREW');
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
      const agent = result._unsafeUnwrap();

      expect(agent).toBeDefined();
      expect(agent.name).toBe(agentData.name);
      expect(agent.tools).toEqual(agentData.tools);
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
      const agent = result._unsafeUnwrap();

      expect(agent).toBeDefined();
      expect(agent.description).toBeNull();
      expect(agent.isCoordinator).toBeNull();
      expect(agent.order).toBeNull();
      expect(agent.temperature).toBeNull();
      expect(agent.tools).toBeNull();
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
      const agents = result._unsafeUnwrap();

      expect(agents).toBeDefined();
      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBe(3);
      agents.forEach((agent: Agent) => {
        expect(agent.crewId).toBe(createdCrew.id);
      });
    });

    it('should return empty array for crew with no agents', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });

      const result = await agentService.listAgents(createdCrew.id);
      const agents = result._unsafeUnwrap();

      expect(agents).toBeDefined();
      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBe(0);
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
      const agent = result._unsafeUnwrap();

      expect(agent).toBeDefined();
      expect(agent?.id).toBe(createdAgent.id);
      expect(agent?.name).toBe(createdAgent.name);
    });

    it('should return error for non-existent agent', async () => {
      const result = await agentService.getAgentById('00000000-0000-0000-0000-000000000000');

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('AGENT_NOT_FOUND');
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
      const agents = result._unsafeUnwrap();

      expect(agents).toBeDefined();
      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBe(2);
      agents.forEach((agent: Agent) => {
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
      const agents = result._unsafeUnwrap();

      expect(agents).toBeDefined();
      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBe(0);
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
      const agent = result._unsafeUnwrap();

      expect(agent).toBeDefined();
      expect(agent?.name).toBe(updateData.name);
      expect(agent?.role).toBe(updateData.role);
      expect(agent?.instructions).toBe(updateData.instructions);
      expect(agent?.temperature).toBe(updateData.temperature);
      // Unchanged fields should remain the same
      expect(agent?.model).toBe(createdAgent.model);
      expect(agent?.crewId).toBe(createdAgent.crewId);
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
      const agent = result._unsafeUnwrap();

      expect(agent).toBeDefined();
      expect(agent?.isCoordinator).toBe(true);
    });

    it('should return error when updating to coordinator when another coordinator exists', async () => {
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
      const result = await agentService.updateAgent(secondAgent.id, { isCoordinator: true });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('ONLY_ONE_AGENT_CAN_BE_COORDINATOR_PER_CREW');
    });

    it('should return error for non-existent agent', async () => {
      const result = await agentService.updateAgent('00000000-0000-0000-0000-000000000000', {
        name: 'Updated Name'
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('AGENT_NOT_FOUND');
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
      const agent = result._unsafeUnwrap();

      expect(agent).toBeDefined();
      expect(agent?.name).toBe('Updated Name');
      expect(agent?.role).toBe('Original Role'); // Should remain unchanged
      expect(agent?.temperature).toBe(70); // Should remain unchanged
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
      const agent = result._unsafeUnwrap();

      expect(agent).toBeDefined();
      expect(agent?.description).toBe('');
      expect(agent?.tools).toEqual([]);
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

      const result = await agentService.deleteAgent(createdAgent.id, createdUser.id);
      const success = result._unsafeUnwrap();

      expect(success).toBe(true);

      // Verify agent is deleted
      const getResult = await agentService.getAgentById(createdAgent.id);
      expect(getResult.isErr()).toBe(true);
      expect(getResult._unsafeUnwrapErr()).toBe('AGENT_NOT_FOUND');
    });

    it('should return error for non-existent agent', async () => {
      const result = await agentService.deleteAgent(
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000000'
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('AGENT_NOT_FOUND');
    });
  });
});
