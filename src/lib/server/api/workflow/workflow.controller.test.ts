import { testingModule } from '$lib/server/test/setup';
import { describe, expect, it } from 'bun:test';

import { createAuthenticatedRequest } from '../../test/helpers';

describe('Workflow Controller', () => {
  const { agentFactory, apiClient, crewFactory, userFactory } = testingModule;

  describe('POST /api/workflows/execute', () => {
    it('should execute a workflow successfully', async () => {
      const { createdUser, userToken } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });
      const _createdAgent = await agentFactory.createBasicAgent({
        crewId: createdCrew.id
      });

      const executeData = {
        crewId: createdCrew.id,
        input: 'Test workflow input'
      };

      const response = await apiClient.api.workflows.execute.post(
        executeData,
        createAuthenticatedRequest({ userToken })
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data?.executionId).toBeDefined();
      expect(typeof response.data?.executionId).toBe('string');
    });

    it('should return 404 for non-existent crew', async () => {
      const { userToken } = await userFactory.createBasicUser();
      const executeData = {
        crewId: '550e8400-e29b-41d4-a716-446655440000',
        input: 'Test workflow input'
      };

      const response = await apiClient.api.workflows.execute.post(
        executeData,
        createAuthenticatedRequest({ userToken })
      );

      expect(response.error?.status).toBe(404);
      expect(response.error).toBeDefined();
    });

    it('should return 400 for crew with no agents', async () => {
      const { createdUser, userToken } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });

      const executeData = {
        crewId: createdCrew.id,
        input: 'Test workflow input'
      };

      const response = await apiClient.api.workflows.execute.post(
        executeData,
        createAuthenticatedRequest({ userToken })
      );

      expect(response.error?.status).toBe(400);
      expect(response.error).toBeDefined();
    });

    it('should return 401 for unauthenticated request', async () => {
      const executeData = {
        crewId: 'test-crew-123',
        input: 'Test workflow input'
      };

      const response = await apiClient.api.workflows.execute.post(
        executeData,
        createAuthenticatedRequest({ userToken: 'test-user-123' })
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/workflows/:id', () => {
    it('should return workflow execution status', async () => {
      const { createdUser, userToken } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });
      const _createdAgent = await agentFactory.createBasicAgent({
        crewId: createdCrew.id
      });

      // First execute a workflow
      const executeResponse = await apiClient.api.workflows.execute.post(
        {
          crewId: createdCrew.id,
          input: 'Test workflow input'
        },
        createAuthenticatedRequest({ userToken })
      );

      const executionId = executeResponse.data?.executionId as string;
      expect(executionId).toBeDefined();
      expect(executionId).toBeTruthy();

      // Then get the execution status
      const response = await apiClient.api.workflows({ id: executionId }).get({
        ...createAuthenticatedRequest({ userToken })
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data?.id).toBe(executionId);
      expect(response.data?.crewId).toBe(createdCrew.id);
      expect(response.data?.input).toBe('Test workflow input');
      expect(response.data?.userId).toBe(createdUser.id);
      expect(response.data?.status).toBeDefined();
      expect(response.data?.startedAt).toBeDefined();
    });

    it('should return 404 for non-existent execution', async () => {
      const { userToken } = await userFactory.createBasicUser();
      const response = await apiClient.api
        .workflows({ id: '550e8400-e29b-41d4-a716-446655440000' })
        .get({
          ...createAuthenticatedRequest({ userToken })
        });

      expect(response.error?.status).toBe(404);
      expect(response.error).toBeDefined();
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await apiClient.api.workflows({ id: 'test-execution-123' }).get({
        ...createAuthenticatedRequest({ userToken: 'test-user-123' })
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/workflows/:id/details', () => {
    it('should return workflow execution with details', async () => {
      const { createdUser, userToken } = await userFactory.createBasicUser();
      const createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });
      const _createdAgent = await agentFactory.createBasicAgent({
        crewId: createdCrew.id
      });

      // First execute a workflow
      const executeResponse = await apiClient.api.workflows.execute.post(
        {
          crewId: createdCrew.id,
          input: 'Test workflow input'
        },
        createAuthenticatedRequest({ userToken })
      );

      const executionId = executeResponse.data?.executionId;
      expect(executionId).toBeDefined();
      expect(executionId).toBeTruthy();

      // Then get the execution details
      const response = await apiClient.api.workflows({ id: executionId! })['details'].get({
        ...createAuthenticatedRequest({ userToken })
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data?.execution.id).toBe(executionId!);
      expect(response.data?.execution.crewId).toBe(createdCrew.id);
      expect(response.data?.agentExecutions).toBeDefined();
      expect(Array.isArray(response.data?.agentExecutions)).toBe(true);
    });

    it('should return 404 for non-existent execution', async () => {
      const { userToken } = await userFactory.createBasicUser();
      const response = await apiClient.api
        .workflows({ id: '550e8400-e29b-41d4-a716-446655440000' })
        ['details'].get({
          ...createAuthenticatedRequest({ userToken })
        });

      expect(response.error?.status).toBe(404);
      expect(response.error).toBeDefined();
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await apiClient.api.workflows({ id: 'test-execution-123' })['details'].get({
        ...createAuthenticatedRequest({ userToken: 'test-user-123' })
      });

      expect(response.status).toBe(401);
    });
  });
});
