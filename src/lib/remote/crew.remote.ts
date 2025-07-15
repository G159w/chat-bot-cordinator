import { command, query } from '$app/server';
import { Object, String } from '@sinclair/typebox';
import { Zod } from '@sinclair/typemap';

import { getServerApiClient } from '../server-api-client';

const idCrewSchema = Zod(
  Object({
    id: String({ description: 'Unique identifier of the crew', format: 'uuid' })
  })
);

const updateCrewSchema = Zod(
  Object({
    description: String({ description: 'Description of the crew' }),
    id: String({ description: 'Unique identifier of the crew', format: 'uuid' }),
    name: String({ description: 'Name of the crew' })
  })
);

export const createTeam = command(async () => {
  const result = await getServerApiClient().api.crews.post({
    description: 'Edit this description to describe your crew',
    name: 'New crew'
  });
  if (result.error) {
    throw new Error('Failed to create crew', { cause: result.error });
  }
  return result.data;
});

export const deleteCrew = command(idCrewSchema, async ({ id }) => {
  const result = await getServerApiClient().api.crews({ id }).delete();
  if (result.error) {
    throw new Error('Failed to delete crew', { cause: result.error });
  }
  return result.data;
});

export const getCrewWithAgents = query(idCrewSchema, async ({ id }) => {
  const result = await getServerApiClient().api.crews({ id })['with-agents'].get();
  if (result.error) {
    throw new Error('Failed to get crew with agents', { cause: result.error });
  }
  return result.data;
});

export const getTeam = query(idCrewSchema, async ({ id }) => {
  const result = await getServerApiClient().api.crews({ id }).get();
  if (result.error) {
    throw new Error('Failed to get crew', { cause: result.error });
  }
  return result.data;
});

export const getCrews = query(async () => {
  const result = await getServerApiClient().api.crews.get();
  if (result.error) {
    throw new Error('Failed to get crews', { cause: result.error });
  }
  return result.data;
});

export const updateCrew = command(updateCrewSchema, async ({ description, id, name }) => {
  const result = await getServerApiClient().api.crews({ id }).put({ description, name });
  if (result.error) {
    throw new Error('Failed to update crew', { cause: result.error });
  }
  return result.data;
});
