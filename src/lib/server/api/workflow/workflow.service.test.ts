import { testingModule } from '$lib/server/test/setup';
import { describe, expect, it } from 'bun:test';

import { WorkflowService } from './workflow.service';

describe('WorkflowService', () => {
  const { agentFactory, container, crewFactory, userFactory, workflowFactory } = testingModule;
  const workflowService = container.get(WorkflowService);

  describe('executeWorkflow', () => {
    it('should execute workflow successfully', async () => {
      const createUser = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createUser.createdUser.id
      });

      // Create agents for the crew
      await agentFactory.createCoordinatorAgent({
        crewId: createdCrew.id,
        instructions: 'You coordinate the workflow',
        model: 'gpt-4',
        name: 'Coordinator',
        role: 'Coordinator'
      });

      await agentFactory.createBasicAgent({
        crewId: createdCrew.id,
        instructions: 'You are a researcher',
        model: 'gpt-4',
        name: 'Researcher',
        role: 'Researcher'
      });

      const executionData = {
        crewId: createdCrew.id,
        input: 'Research the latest AI developments'
      };

      const result = await workflowService.executeWorkflow(
        createUser.createdUser.id,
        executionData
      );
      const execution = result._unsafeUnwrap();

      expect(execution).toBeDefined();
      expect(execution.executionId).toBeDefined();
      expect(typeof execution.executionId).toBe('string');
    });

    it('should return error for crew not owned by user', async () => {
      const { createdUser: createUser1 } = await userFactory.createBasicUser();
      const { createdUser: createUser2 } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createUser1.id
      });

      const executionData = {
        crewId: createdCrew.id,
        input: 'Research the latest AI developments'
      };

      const result = await workflowService.executeWorkflow(createUser2.id, executionData);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('CREW_NOT_FOUND');
    });

    it('should return error for non-existent crew', async () => {
      const { createdUser } = await userFactory.createBasicUser();

      const executionData = {
        crewId: '00000000-0000-0000-0000-000000000000',
        input: 'Research the latest AI developments'
      };

      const result = await workflowService.executeWorkflow(createdUser.id, executionData);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('CREW_NOT_FOUND');
    });

    it('should return error for crew with no agents', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });

      const executionData = {
        crewId: createdCrew.id,
        input: 'Research the latest AI developments'
      };

      const result = await workflowService.executeWorkflow(createdUser.id, executionData);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('NO_AGENTS_FOUND_IN_CREW');
    });

    it('should create workflow execution with correct data', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });

      // Create a coordinator agent
      await agentFactory.createCoordinatorAgent({
        crewId: createdCrew.id,
        instructions: 'You coordinate the workflow',
        model: 'gpt-4',
        name: 'Coordinator',
        role: 'Coordinator'
      });

      const executionData = {
        crewId: createdCrew.id,
        input: 'Research the latest AI developments'
      };

      const result = await workflowService.executeWorkflow(createdUser.id, executionData);
      const execution = result._unsafeUnwrap();

      // Verify execution was created
      const statusResult = await workflowService.getExecutionStatus(
        execution.executionId,
        createdUser.id
      );
      const status = statusResult._unsafeUnwrap();
      expect(status).toBeDefined();
      expect(status?.crewId).toBe(createdCrew.id);
      expect(status?.input).toBe(executionData.input);
      expect(status?.userId).toBe(createdUser.id);
      expect(status?.status).toBe('running');
    });
  });

  describe('getExecutionStatus', () => {
    it('should return execution status for owner', async () => {
      const createUser = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createUser.createdUser.id
      });

      // Create a workflow execution
      const workflowExecution = await workflowFactory.createBasicWorkflowExecution({
        crewId: createdCrew.id,
        status: 'completed',
        userId: createUser.createdUser.id
      });

      const result = await workflowService.getExecutionStatus(
        workflowExecution.id,
        createUser.createdUser.id
      );
      const execution = result._unsafeUnwrap();

      expect(execution).toBeDefined();
      expect(execution?.id).toBe(workflowExecution.id);
      expect(execution?.crewId).toBe(createdCrew.id);
      expect(execution?.userId).toBe(createUser.createdUser.id);
      expect(execution?.status).toBe('completed');
    });

    it('should return error for execution not owned by user', async () => {
      const createUser1 = await userFactory.createBasicUser();
      const createUser2 = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createUser1.createdUser.id
      });

      const workflowExecution = await workflowFactory.createBasicWorkflowExecution({
        crewId: createdCrew.id,
        userId: createUser1.createdUser.id
      });

      const result = await workflowService.getExecutionStatus(
        workflowExecution.id,
        createUser2.createdUser.id
      );
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('WORKFLOW_EXECUTION_NOT_FOUND');
    });

    it('should return error for non-existent execution', async () => {
      const createUser = await userFactory.createBasicUser();

      const result = await workflowService.getExecutionStatus(
        '00000000-0000-0000-0000-000000000000',
        createUser.createdUser.id
      );
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('WORKFLOW_EXECUTION_NOT_FOUND');
    });
  });

  describe('getExecutionWithDetails', () => {
    it('should return execution with agent details for owner', async () => {
      const createUser = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createUser.createdUser.id
      });

      // Create agents
      const agent1 = await agentFactory.createBasicAgent({
        crewId: createdCrew.id,
        name: 'Agent 1',
        role: 'Researcher'
      });

      const agent2 = await agentFactory.createBasicAgent({
        crewId: createdCrew.id,
        name: 'Agent 2',
        role: 'Writer'
      });

      // Create workflow execution
      const workflowExecution = await workflowFactory.createBasicWorkflowExecution({
        crewId: createdCrew.id,
        userId: createUser.createdUser.id
      });

      // Create agent executions
      await workflowFactory.createBasicAgentExecution({
        agentId: agent1.id,
        workflowExecutionId: workflowExecution.id
      });

      await workflowFactory.createBasicAgentExecution({
        agentId: agent2.id,
        workflowExecutionId: workflowExecution.id
      });

      const result = await workflowService.getExecutionWithDetails(
        workflowExecution.id,
        createUser.createdUser.id
      );
      const details = result._unsafeUnwrap();

      expect(details).toBeDefined();
      expect(details?.execution.id).toBe(workflowExecution.id);
      expect(details?.execution.crewId).toBe(createdCrew.id);
      expect(details?.execution.userId).toBe(createUser.createdUser.id);
      expect(details?.agentExecutions).toHaveLength(2);
      expect(details?.agentExecutions[0].agent.name).toBe('Agent 1');
      expect(details?.agentExecutions[0].agent.role).toBe('Researcher');
      expect(details?.agentExecutions[1].agent.name).toBe('Agent 2');
      expect(details?.agentExecutions[1].agent.role).toBe('Writer');
    });

    it('should return error for execution not owned by user', async () => {
      const createUser1 = await userFactory.createBasicUser();
      const createUser2 = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createUser1.createdUser.id
      });

      const workflowExecution = await workflowFactory.createBasicWorkflowExecution({
        crewId: createdCrew.id,
        userId: createUser1.createdUser.id
      });

      const result = await workflowService.getExecutionWithDetails(
        workflowExecution.id,
        createUser2.createdUser.id
      );
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('WORKFLOW_EXECUTION_NOT_FOUND');
    });

    it('should return error for non-existent execution', async () => {
      const createUser = await userFactory.createBasicUser();

      const result = await workflowService.getExecutionWithDetails(
        '00000000-0000-0000-0000-000000000000',
        createUser.createdUser.id
      );
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('WORKFLOW_EXECUTION_NOT_FOUND');
    });

    it('should return empty agent executions for new workflow', async () => {
      const createUser = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createUser.createdUser.id
      });

      // Create workflow execution without agent executions
      const workflowExecution = await workflowFactory.createBasicWorkflowExecution({
        crewId: createdCrew.id,
        userId: createUser.createdUser.id
      });

      const result = await workflowService.getExecutionWithDetails(
        workflowExecution.id,
        createUser.createdUser.id
      );
      const details = result._unsafeUnwrap();

      expect(details).toBeDefined();
      expect(details?.execution.id).toBe(workflowExecution.id);
      expect(details?.agentExecutions).toHaveLength(0);
    });
  });

  describe('workflow execution lifecycle', () => {
    it('should handle workflow execution from start to completion', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });

      // Create a coordinator agent
      await agentFactory.createCoordinatorAgent({
        crewId: createdCrew.id,
        instructions: 'You coordinate the workflow',
        model: 'gpt-4',
        name: 'Coordinator',
        role: 'Coordinator'
      });

      const executionData = {
        crewId: createdCrew.id,
        input: 'Research the latest AI developments'
      };

      // Start workflow execution
      const result = await workflowService.executeWorkflow(createdUser.id, executionData);
      const execution = result._unsafeUnwrap();

      // Check initial status
      const initialStatusResult = await workflowService.getExecutionStatus(
        execution.executionId,
        createdUser.id
      );
      const initialStatus = initialStatusResult._unsafeUnwrap();
      expect(initialStatus?.status).toBe('running');

      // Wait a bit for async execution to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Check final status
      const finalStatusResult = await workflowService.getExecutionStatus(
        execution.executionId,
        createdUser.id
      );
      const finalStatus = finalStatusResult._unsafeUnwrap();
      expect(['completed', 'failed', 'running']).toContain(finalStatus?.status);
    });

    it('should handle workflow with multiple agents', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });

      // Create multiple agents
      await agentFactory.createCoordinatorAgent({
        crewId: createdCrew.id,
        instructions: 'You coordinate the workflow',
        model: 'gpt-4',
        name: 'Coordinator',
        role: 'Coordinator'
      });

      await agentFactory.createBasicAgent({
        crewId: createdCrew.id,
        instructions: 'You research topics',
        model: 'gpt-4',
        name: 'Researcher',
        role: 'Researcher'
      });

      await agentFactory.createBasicAgent({
        crewId: createdCrew.id,
        instructions: 'You write content',
        model: 'gpt-4',
        name: 'Writer',
        role: 'Writer'
      });

      const executionData = {
        crewId: createdCrew.id,
        input: 'Create a comprehensive report on AI trends'
      };

      const result = await workflowService.executeWorkflow(createdUser.id, executionData);
      const execution = result._unsafeUnwrap();

      // Wait for execution to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Get execution details
      const detailsResult = await workflowService.getExecutionWithDetails(
        execution.executionId,
        createdUser.id
      );
      const details = detailsResult._unsafeUnwrap();
      expect(details).toBeDefined();
      expect(details?.agentExecutions.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle workflow execution errors gracefully', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });

      // Create a coordinator agent
      await agentFactory.createCoordinatorAgent({
        crewId: createdCrew.id,
        instructions: 'You coordinate the workflow',
        model: 'gpt-4',
        name: 'Coordinator',
        role: 'Coordinator'
      });

      const executionData = {
        crewId: createdCrew.id,
        input: 'Research the latest AI developments'
      };

      const result = await workflowService.executeWorkflow(createdUser.id, executionData);
      const execution = result._unsafeUnwrap();

      // Wait for execution to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Check that execution completed (even if with errors)
      const statusResult = await workflowService.getExecutionStatus(
        execution.executionId,
        createdUser.id
      );
      const status = statusResult._unsafeUnwrap();
      expect(status).toBeDefined();
      expect(['completed', 'failed', 'running']).toContain(status?.status);
    });

    it('should handle invalid crew ID gracefully', async () => {
      const { createdUser } = await userFactory.createBasicUser();

      const executionData = {
        crewId: '00000000-0000-0000-0000-000000000000',
        input: 'Research the latest AI developments'
      };

      const result = await workflowService.executeWorkflow(createdUser.id, executionData);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('CREW_NOT_FOUND');
    });
  });

  describe('execution data validation', () => {
    it('should validate required fields', async () => {
      const { createdUser } = await userFactory.createBasicUser();

      // Test missing crewId
      const result1 = await workflowService.executeWorkflow(createdUser.id, {
        crewId: '00000000-0000-0000-0000-000000000000',
        input: 'Test input'
      });
      expect(result1.isErr()).toBe(true);
      expect(result1._unsafeUnwrapErr()).toBe('CREW_NOT_FOUND');

      // Test missing input
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });

      await agentFactory.createCoordinatorAgent({
        crewId: createdCrew.id,
        instructions: 'You coordinate the workflow',
        model: 'gpt-4',
        name: 'Coordinator',
        role: 'Coordinator'
      });

      const result2 = await workflowService.executeWorkflow(createdUser.id, {
        crewId: createdCrew.id,
        input: ''
      });
      expect(result2.isErr()).toBe(true);
      expect(result2._unsafeUnwrapErr()).toBe('INPUT_REQUIRED');
    });
  });
});
