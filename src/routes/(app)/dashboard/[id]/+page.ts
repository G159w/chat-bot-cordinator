import { getCrewWithAgents } from '$lib/remote/crew.remote';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ data, params }) => {
  const crew = await getCrewWithAgents({ id: params.id });

  return {
    crew,
    ...data
  };
};
