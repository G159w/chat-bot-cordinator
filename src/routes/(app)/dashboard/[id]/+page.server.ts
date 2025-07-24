import { upsertAgentSchema } from '$lib/components/app/crew/crew-overview/upsert-agent.schema.js';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
  return {
    form: await superValidate(valibot(upsertAgentSchema))
  };
};

export const actions: Actions = {
  validateUpsertAgent: async (event) => {
    const form = await superValidate(event, valibot(upsertAgentSchema));
    if (!form.valid) {
      return fail(400, {
        form
      });
    }
    return {
      form
    };
  }
};
