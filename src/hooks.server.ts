import type { Handle } from '@sveltejs/kit';

import { sequence } from '@sveltejs/kit/hooks';

import { handle as handleAuth } from './auth';

// Without this custom hook, sveltekit would not allow the response from Elysia.
const handleFn = (async ({ event, resolve }) => {
  return await resolve(event, {
    filterSerializedResponseHeaders: () => {
      return true;
    }
  });
}) satisfies Handle;

// Sequence is a custom hook that allows multiple hooks to be executed in sequence.
export const handle = sequence(handleFn, handleAuth);
