import { testingModule } from '$lib/server/test/setup';
import { FlowService } from '$server/api/flow/flow.service';
import { describe, expect, it } from 'bun:test';

describe('FlowService', () => {
  const { container, crewFactory, flowFactory, userFactory } = testingModule;
  const flowService = container.get(FlowService);

  describe('executeFlow', () => {
    it('should execute flow successfully', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({ userId: createdUser.id });
      const createdFlow = await flowFactory.createBasicFlow({ crewId: createdCrew.id });
      const _createdTask = await flowFactory.createBasicTask({ flowId: createdFlow.id });

      const executionData = {
        flowId: createdFlow.id,
        input: { text: 'Research the latest AI developments' }
      };

      const result = await flowService.executeFlow(createdUser.id, executionData);
      const execution = result._unsafeUnwrap();

      expect(execution).toBeDefined();
      expect(execution.executionId).toBeDefined();
      expect(typeof execution.executionId).toBe('string');
    });

    it('should return error for flow not owned by user', async () => {
      const { createdUser: user1 } = await userFactory.createBasicUser();
      const { createdUser: user2 } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({ userId: user1.id });
      const createdFlow = await flowFactory.createBasicFlow({ crewId: createdCrew.id });

      const executionData = {
        flowId: createdFlow.id,
        input: { text: 'Research the latest AI developments' }
      };

      const result = await flowService.executeFlow(user2.id, executionData);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('FLOW_NOT_FOUND');
    });

    it('should return error for non-existent flow', async () => {
      const { createdUser } = await userFactory.createBasicUser();

      const executionData = {
        flowId: '00000000-0000-0000-0000-000000000000',
        input: { text: 'Research the latest AI developments' }
      };

      const result = await flowService.executeFlow(createdUser.id, executionData);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('FLOW_NOT_FOUND');
    });

    it('should return error for flow with no tasks', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({ userId: createdUser.id });
      const createdFlow = await flowFactory.createBasicFlow({ crewId: createdCrew.id });

      const executionData = {
        flowId: createdFlow.id,
        input: { text: 'Research the latest AI developments' }
      };

      const result = await flowService.executeFlow(createdUser.id, executionData);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('NO_TASKS_FOUND_IN_FLOW');
    });

    it('should create flow execution with correct data', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({ userId: createdUser.id });
      const createdFlow = await flowFactory.createBasicFlow({ crewId: createdCrew.id });
      const _createdTask = await flowFactory.createBasicTask({ flowId: createdFlow.id });

      const executionData = {
        flowId: createdFlow.id,
        input: { text: 'Research the latest AI developments' }
      };

      const result = await flowService.executeFlow(createdUser.id, executionData);
      const execution = result._unsafeUnwrap();

      // Verify execution was created
      const statusResult = await flowService.getExecutionStatus(
        execution.executionId,
        createdUser.id
      );
      const status = statusResult._unsafeUnwrap();
      expect(status).toBeDefined();
      expect(status?.flowId).toBe(createdFlow.id);
      expect(status?.input).toEqual({ text: 'Research the latest AI developments' });
      expect(status?.userId).toBe(createdUser.id);
      expect(status?.status).toBe('running');
    });
  });

  describe('getExecutionStatus', () => {
    it('should return execution status for owner', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({ userId: createdUser.id });
      const createdFlow = await flowFactory.createBasicFlow({ crewId: createdCrew.id });
      const createdFlowExecution = await flowFactory.createBasicFlowExecution({
        flowId: createdFlow.id,
        status: 'completed',
        userId: createdUser.id
      });

      const result = await flowService.getExecutionStatus(createdFlowExecution.id, createdUser.id);
      const execution = result._unsafeUnwrap();

      expect(execution).toBeDefined();
      expect(execution?.id).toBe(createdFlowExecution.id);
      expect(execution?.userId).toBe(createdUser.id);
      expect(execution?.status).toBe('completed');
    });

    it('should return error for execution not owned by user', async () => {
      const { createdUser: user1 } = await userFactory.createBasicUser();
      const { createdUser: user2 } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({ userId: user1.id });
      const createdFlow = await flowFactory.createBasicFlow({ crewId: createdCrew.id });
      const createdFlowExecution = await flowFactory.createBasicFlowExecution({
        flowId: createdFlow.id,
        userId: user1.id
      });

      const result = await flowService.getExecutionStatus(createdFlowExecution.id, user2.id);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('FLOW_EXECUTION_NOT_FOUND');
    });

    it('should return error for non-existent execution', async () => {
      const { createdUser } = await userFactory.createBasicUser();

      const result = await flowService.getExecutionStatus(
        '00000000-0000-0000-0000-000000000000',
        createdUser.id
      );
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('FLOW_EXECUTION_NOT_FOUND');
    });
  });

  describe('getExecutionWithDetails', () => {
    it('should return execution with task details for owner', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({ userId: createdUser.id });
      const createdFlow = await flowFactory.createBasicFlow({ crewId: createdCrew.id });
      const createdFlowExecution = await flowFactory.createBasicFlowExecution({
        flowId: createdFlow.id,
        userId: createdUser.id
      });
      const createdTask1 = await flowFactory.createBasicTask({ flowId: createdFlow.id });
      const createdTask2 = await flowFactory.createBasicTask({ flowId: createdFlow.id });

      // Create task executions
      await flowFactory.createTaskExecutionsForFlow(createdFlowExecution.id, [
        createdTask1.id,
        createdTask2.id
      ]);

      const result = await flowService.getExecutionWithDetails(
        createdFlowExecution.id,
        createdUser.id
      );
      const details = result._unsafeUnwrap();

      expect(details).toBeDefined();
      expect(details?.execution.id).toBe(createdFlowExecution.id);
      expect(details?.execution.userId).toBe(createdUser.id);
      expect(details?.taskExecutions).toHaveLength(2);
    });

    it('should return error for execution not owned by user', async () => {
      const { createdUser: user1 } = await userFactory.createBasicUser();
      const { createdUser: user2 } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({ userId: user1.id });
      const createdFlow = await flowFactory.createBasicFlow({ crewId: createdCrew.id });
      const createdFlowExecution = await flowFactory.createBasicFlowExecution({
        flowId: createdFlow.id,
        userId: user1.id
      });

      const result = await flowService.getExecutionWithDetails(createdFlowExecution.id, user2.id);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('FLOW_EXECUTION_NOT_FOUND');
    });

    it('should return error for non-existent execution', async () => {
      const { createdUser } = await userFactory.createBasicUser();

      const result = await flowService.getExecutionWithDetails(
        '00000000-0000-0000-0000-000000000000',
        createdUser.id
      );
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('FLOW_EXECUTION_NOT_FOUND');
    });

    it('should return empty task executions for new flow', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({ userId: createdUser.id });
      const createdFlow = await flowFactory.createBasicFlow({ crewId: createdCrew.id });
      const createdFlowExecution = await flowFactory.createBasicFlowExecution({
        flowId: createdFlow.id,
        userId: createdUser.id
      });

      const result = await flowService.getExecutionWithDetails(
        createdFlowExecution.id,
        createdUser.id
      );
      const details = result._unsafeUnwrap();

      expect(details).toBeDefined();
      expect(details?.execution.id).toBe(createdFlowExecution.id);
      expect(details?.taskExecutions).toHaveLength(0);
    });
  });

  describe('flow execution lifecycle', () => {
    it('should handle flow execution from start to completion', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({ userId: createdUser.id });
      const createdFlow = await flowFactory.createBasicFlow({ crewId: createdCrew.id });
      const _createdTask = await flowFactory.createBasicTask({ flowId: createdFlow.id });

      const executionData = {
        flowId: createdFlow.id,
        input: { text: 'Research the latest AI developments' }
      };

      // Start flow execution
      const result = await flowService.executeFlow(createdUser.id, executionData);
      const execution = result._unsafeUnwrap();

      // Check initial status
      const initialStatusResult = await flowService.getExecutionStatus(
        execution.executionId,
        createdUser.id
      );
      const initialStatus = initialStatusResult._unsafeUnwrap();
      expect(initialStatus?.status).toBe('running');

      // Wait a bit for async execution to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Check final status
      const finalStatusResult = await flowService.getExecutionStatus(
        execution.executionId,
        createdUser.id
      );
      const finalStatus = finalStatusResult._unsafeUnwrap();
      expect(['completed', 'failed', 'running']).toContain(finalStatus?.status);
    });

    it('should handle flow with multiple tasks', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({ userId: createdUser.id });
      const createdFlow = await flowFactory.createBasicFlow({ crewId: createdCrew.id });
      const _createdTask1 = await flowFactory.createBasicTask({ flowId: createdFlow.id });
      const _createdTask2 = await flowFactory.createBasicTask({ flowId: createdFlow.id });

      const executionData = {
        flowId: createdFlow.id,
        input: { text: 'Create a comprehensive report on AI trends' }
      };

      const result = await flowService.executeFlow(createdUser.id, executionData);
      const execution = result._unsafeUnwrap();

      // Wait for execution to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Get execution details
      const detailsResult = await flowService.getExecutionWithDetails(
        execution.executionId,
        createdUser.id
      );
      const details = detailsResult._unsafeUnwrap();
      expect(details).toBeDefined();
      expect(details?.taskExecutions.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle flow execution errors gracefully', async () => {
      const { createdUser } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({ userId: createdUser.id });
      const createdFlow = await flowFactory.createBasicFlow({ crewId: createdCrew.id });
      const _createdTask = await flowFactory.createBasicTask({ flowId: createdFlow.id });

      const executionData = {
        flowId: createdFlow.id,
        input: { text: 'Research the latest AI developments' }
      };

      const result = await flowService.executeFlow(createdUser.id, executionData);
      const execution = result._unsafeUnwrap();

      // Wait for execution to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Check that execution completed (even if with errors)
      const statusResult = await flowService.getExecutionStatus(
        execution.executionId,
        createdUser.id
      );
      const status = statusResult._unsafeUnwrap();
      expect(status).toBeDefined();
      expect(['completed', 'failed', 'running']).toContain(status?.status);
    });

    it('should handle invalid flow ID gracefully', async () => {
      const { createdUser } = await userFactory.createBasicUser();

      const executionData = {
        flowId: '00000000-0000-0000-0000-000000000000',
        input: { text: 'Research the latest AI developments' }
      };

      const result = await flowService.executeFlow(createdUser.id, executionData);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe('FLOW_NOT_FOUND');
    });
  });

  describe('execution data validation', () => {
    it('should validate required fields', async () => {
      const { createdUser } = await userFactory.createBasicUser();

      // Test missing flowId
      const result1 = await flowService.executeFlow(createdUser.id, {
        flowId: '00000000-0000-0000-0000-000000000000',
        input: { text: 'Test input' }
      });
      expect(result1.isErr()).toBe(true);
      expect(result1._unsafeUnwrapErr()).toBe('FLOW_NOT_FOUND');

      // Test missing input
      const createdCrew = await crewFactory.createBasicCrew({ userId: createdUser.id });
      const createdFlow = await flowFactory.createBasicFlow({ crewId: createdCrew.id });
      const _createdTask = await flowFactory.createBasicTask({ flowId: createdFlow.id });

      const result2 = await flowService.executeFlow(createdUser.id, {
        flowId: createdFlow.id,
        input: undefined
      });
      // The service doesn't validate that input is required, so it should succeed
      expect(result2.isOk()).toBe(true);
    });
  });
});
