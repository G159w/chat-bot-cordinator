import { testingModule } from '$lib/server/test/setup';
import { createAuthenticatedRequest } from '$server/test/helpers';
import { describe, expect, it } from 'bun:test';

describe('Crew Controller', () => {
  const { agentFactory, apiClient, crewFactory, userFactory } = testingModule;

  describe('GET /api/crews', () => {
    it('should return all crews for authenticated user', async () => {
      const { createdUser, userToken } = await userFactory.createBasicUser();
      const _createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });

      const response = await apiClient.api.crews.get({
        ...createAuthenticatedRequest({ userToken })
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data?.length).toBeGreaterThan(0);

      // Verify crew structure
      const responseCrew = response.data?.[0];
      expect(responseCrew).toHaveProperty('id');
      expect(responseCrew).toHaveProperty('name');
      expect(responseCrew).toHaveProperty('description');
      expect(responseCrew).toHaveProperty('userId');
      expect(responseCrew).toHaveProperty('isActive');
      expect(responseCrew).toHaveProperty('createdAt');
      expect(responseCrew).toHaveProperty('updatedAt');
    });

    it('should return empty array for user with no crews', async () => {
      const { userToken } = await userFactory.createBasicUser();

      const response = await apiClient.api.crews.get({
        ...createAuthenticatedRequest({ userToken })
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data?.length).toBe(0);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await apiClient.api.crews.get({
        ...createAuthenticatedRequest({ userToken: 'test-crew-123' })
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/crews/:id', () => {
    it('should return specific crew by ID', async () => {
      const { createdUser, userToken } = await userFactory.createBasicUser();
      const _createdCrew = await crewFactory.createBasicCrew({
        name: 'Test Crew',
        userId: createdUser.id
      });
      const response = await apiClient.api.crews({ id: _createdCrew.id }).get({
        ...createAuthenticatedRequest({ userToken })
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data?.id).toBe(_createdCrew.id);
      expect(response.data?.name).toBe('Test Crew');
    });

    it('should return null for non-existent crew', async () => {
      const { userToken } = await userFactory.createBasicUser();
      const response = await apiClient.api
        .crews({ id: '550e8400-e29b-41d4-a716-446655440000' })
        .get({
          ...createAuthenticatedRequest({ userToken })
        });

      expect(response.error?.status).toBe(404);
      expect(response.error).toBeDefined();
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await apiClient.api.crews({ id: 'test-crew-123' }).get({
        ...createAuthenticatedRequest({ userToken: 'test-crew-123' })
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/crews/:id/with-agents', () => {
    it('should return crew with all its agents', async () => {
      const { createdUser, userToken } = await userFactory.createBasicUser();
      const _createdCrew = await crewFactory.createBasicCrew({
        name: 'Test Crew',
        userId: createdUser.id
      });
      const _createdAgent = await agentFactory.createBasicAgent({
        crewId: _createdCrew.id
      });
      const response = await apiClient.api.crews({ id: _createdCrew.id })['with-agents'].get({
        ...createAuthenticatedRequest({ userToken })
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data?.id).toBe(_createdCrew.id);
      expect(response.data?.name).toBe('Test Crew');
      expect(response.data?.agents).toBeDefined();
      expect(Array.isArray(response.data?.agents)).toBe(true);
      expect(response.data?.agents?.length).toBeGreaterThan(0);
    });

    it('should return null for non-existent crew', async () => {
      const { userToken } = await userFactory.createBasicUser();
      const response = await apiClient.api
        .crews({ id: '550e8400-e29b-41d4-a716-446655440000' })
        ['with-agents'].get({
          ...createAuthenticatedRequest({ userToken })
        });

      expect(response.error?.status).toBe(404);
      expect(response.data).toBeNull();
      expect(response.error).toBeDefined();
    });
  });

  describe('POST /api/crews', () => {
    it('should create a new crew', async () => {
      const { createdUser, userToken } = await userFactory.createBasicUser();
      const newCrew = {
        description: 'A new test crew',
        name: 'New Test Crew'
      };

      const response = await apiClient.api.crews.post(
        {
          description: newCrew.description,
          name: newCrew.name
        },
        createAuthenticatedRequest({ userToken })
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data?.name).toBe(newCrew.name);
      expect(response.data?.description).toBe(newCrew.description);
      expect(response.data?.userId).toBe(createdUser.id);
      expect(response.data?.isActive).toBe(true);
      expect(response.data?.id).toBeDefined();
      expect(response.data?.createdAt).toBeDefined();
      expect(response.data?.updatedAt).toBeDefined();
    });

    it('should create crew with agents', async () => {
      const { userToken } = await userFactory.createBasicUser();

      const newCrew = {
        agents: [
          {
            instructions: 'Instructions for agent 1',
            model: 'gpt-4',
            name: 'Agent 1',
            role: 'Role 1',
            temperature: 70
          },
          {
            instructions: 'Instructions for agent 2',
            model: 'gpt-3.5-turbo',
            name: 'Agent 2',
            role: 'Role 2',
            temperature: 50
          }
        ],
        description: 'A crew with agents',
        name: 'Crew with Agents'
      };

      const response = await apiClient.api.crews.post(
        {
          agents: newCrew.agents,
          description: newCrew.description,
          name: newCrew.name
        },
        createAuthenticatedRequest({ userToken })
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data?.name).toBe(newCrew.name);
    });
  });

  describe('PUT /api/crews/:id', () => {
    it('should update an existing crew', async () => {
      const { createdUser, userToken } = await userFactory.createBasicUser();
      const _createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });
      const updateData = {
        description: 'Updated description',
        name: 'Updated Test Crew'
      };

      const response = await apiClient.api.crews({ id: _createdCrew.id }).put(
        {
          description: updateData.description,
          name: updateData.name
        },
        createAuthenticatedRequest({ userToken })
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data?.id).toBe(_createdCrew.id);
      expect(response.data?.name).toBe(updateData.name);
      expect(response.data?.description).toBe(updateData.description);
    });

    it('should return null for non-existent crew', async () => {
      const { userToken } = await userFactory.createBasicUser();
      const response = await apiClient.api
        .crews({ id: '550e8400-e29b-41d4-a716-446655440000' })
        .put(
          {
            description: 'Updated description'
          },
          createAuthenticatedRequest({ userToken })
        );

      expect(response.error?.status).toBe(404);
      expect(response.error).toBeDefined();
    });

    it('should support partial updates', async () => {
      const { createdUser, userToken } = await userFactory.createBasicUser();
      const _createdCrew = await crewFactory.createBasicCrew({
        name: 'Test Crew',
        userId: createdUser.id
      });
      const updateData = {
        description: 'Only description updated'
      };

      const response = await apiClient.api.crews({ id: _createdCrew.id }).put(
        {
          ...updateData
        },
        createAuthenticatedRequest({ userToken })
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data?.id).toBe(_createdCrew.id);
      expect(response.data?.name).toBe('Test Crew'); // Original name preserved
      expect(response.data?.description).toBe(updateData.description);
    });
  });

  describe('DELETE /api/crews/:id', () => {
    it('should delete an existing crew', async () => {
      const { createdUser, userToken } = await userFactory.createBasicUser();
      const _createdCrew = await crewFactory.createBasicCrew({
        userId: createdUser.id
      });

      const response = await apiClient.api
        .crews({ id: _createdCrew.id })
        .delete({}, createAuthenticatedRequest({ userToken }));

      expect(response.status).toBe(200);
      expect(response.data).toBe(true);

      // Verify crew is deleted
      const getResponse = await apiClient.api.crews({ id: _createdCrew.id }).get({
        ...createAuthenticatedRequest({ userToken })
      });

      expect(getResponse.data).toBeNull();
    });

    it('should return false for non-existent crew', async () => {
      const { userToken } = await userFactory.createBasicUser();
      const response = await apiClient.api
        .crews({ id: '550e8400-e29b-41d4-a716-446655440000' })
        .delete({}, createAuthenticatedRequest({ userToken }));

      expect(response.error).toBeDefined();
      expect(response.error?.status).toBe(404);
    });
  });
});
