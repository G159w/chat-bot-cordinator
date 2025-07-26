import { testingModule } from '$lib/server/test/setup';
import { createAuthenticatedRequest } from '$server/test/helpers';
import { describe, expect, it } from 'bun:test';

describe('Flow Controller', () => {
  const { apiClient, crewFactory, flowFactory, userFactory } = testingModule;

  describe('POST /api/flows/execute', () => {
    it('should execute a flow successfully', async () => {
      const { createdUser, userToken } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({ userId: createdUser.id });
      const createdFlow = await flowFactory.createBasicFlow({ crewId: createdCrew.id });
      const _createdTask = await flowFactory.createBasicTask({ flowId: createdFlow.id });

      const executeData = {
        flowId: createdFlow.id,
        input: { text: 'Test flow input' }
      };

      const response = await apiClient.api.flows.execute.post(
        executeData,
        createAuthenticatedRequest({ userToken })
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data?.executionId).toBeDefined();
      expect(typeof response.data?.executionId).toBe('string');
    });

    it('should return 404 for non-existent flow', async () => {
      const { userToken } = await userFactory.createBasicUser();
      const executeData = {
        flowId: '550e8400-e29b-41d4-a716-446655440000',
        input: { text: 'Test flow input' }
      };

      const response = await apiClient.api.flows.execute.post(
        executeData,
        createAuthenticatedRequest({ userToken })
      );

      expect(response.error?.status).toBe(404);
      expect(response.error).toBeDefined();
    });

    it('should return 400 for flow with no tasks', async () => {
      const { createdUser, userToken } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({ userId: createdUser.id });
      const createdFlow = await flowFactory.createBasicFlow({ crewId: createdCrew.id });

      const executeData = {
        flowId: createdFlow.id,
        input: { text: 'Test flow input' }
      };

      const response = await apiClient.api.flows.execute.post(
        executeData,
        createAuthenticatedRequest({ userToken })
      );

      expect(response.error?.status).toBe(400);
      expect(response.error).toBeDefined();
    });

    it('should return 401 for unauthenticated request', async () => {
      const executeData = {
        flowId: 'test-flow-123',
        input: { text: 'Test flow input' }
      };

      const response = await apiClient.api.flows.execute.post(
        executeData,
        createAuthenticatedRequest({ userToken: 'test-user-123' })
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/flows/executions/:id', () => {
    it('should return flow execution status', async () => {
      const { createdUser, userToken } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({ userId: createdUser.id });
      const createdFlow = await flowFactory.createBasicFlow({ crewId: createdCrew.id });
      const _createdTask = await flowFactory.createBasicTask({ flowId: createdFlow.id });

      // First execute a flow
      const executeResponse = await apiClient.api.flows.execute.post(
        {
          flowId: createdFlow.id,
          input: { text: 'Test flow input' }
        },
        createAuthenticatedRequest({ userToken })
      );

      const executionId = executeResponse.data?.executionId as string;
      expect(executionId).toBeDefined();
      expect(executionId).toBeTruthy();

      // Then get the execution status
      const response = await apiClient.api.flows.executions({ id: executionId }).get({
        ...createAuthenticatedRequest({ userToken })
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data?.id).toBe(executionId);
      expect(response.data?.flowId).toBe(createdFlow.id);
      expect(response.data?.input).toEqual({ text: 'Test flow input' });
      expect(response.data?.userId).toBe(createdUser.id);
      expect(response.data?.status).toBeDefined();
      expect(response.data?.createdAt).toBeDefined();
    });

    it('should return 404 for non-existent execution', async () => {
      const { userToken } = await userFactory.createBasicUser();
      const response = await apiClient.api.flows
        .executions({ id: '550e8400-e29b-41d4-a716-446655440000' })
        .get({
          ...createAuthenticatedRequest({ userToken })
        });

      expect(response.error?.status).toBe(404);
      expect(response.error).toBeDefined();
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await apiClient.api.flows.executions({ id: 'test-execution-123' }).get({
        ...createAuthenticatedRequest({ userToken: 'test-user-123' })
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/flows/executions/:id/details', () => {
    it('should return flow execution with details', async () => {
      const { createdUser, userToken } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({ userId: createdUser.id });
      const createdFlow = await flowFactory.createBasicFlow({ crewId: createdCrew.id });
      const _createdTask = await flowFactory.createBasicTask({ flowId: createdFlow.id });

      // First execute a flow
      const executeResponse = await apiClient.api.flows.execute.post(
        {
          flowId: createdFlow.id,
          input: { text: 'Test flow input' }
        },
        createAuthenticatedRequest({ userToken })
      );

      const executionId = executeResponse.data?.executionId;
      expect(executionId).toBeDefined();
      expect(executionId).toBeTruthy();

      // Then get the execution details
      const response = await apiClient.api.flows.executions({ id: executionId! })['details'].get({
        ...createAuthenticatedRequest({ userToken })
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data?.execution.id).toBe(executionId!);
      expect(response.data?.execution.flowId).toBe(createdFlow.id);
      expect(response.data?.taskExecutions).toBeDefined();
      expect(Array.isArray(response.data?.taskExecutions)).toBe(true);
    });

    it('should return 404 for non-existent execution', async () => {
      const { userToken } = await userFactory.createBasicUser();
      const response = await apiClient.api.flows
        .executions({ id: '550e8400-e29b-41d4-a716-446655440000' })
        ['details'].get({
          ...createAuthenticatedRequest({ userToken })
        });

      expect(response.error?.status).toBe(404);
      expect(response.error).toBeDefined();
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await apiClient.api.flows
        .executions({ id: 'test-execution-123' })
        ['details'].get({
          ...createAuthenticatedRequest({ userToken: 'test-user-123' })
        });

      expect(response.status).toBe(401);
    });
  });
});
