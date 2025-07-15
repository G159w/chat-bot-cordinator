import { apiClient } from '$lib';
import { redirect } from '@sveltejs/kit';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
  const { session } = await parent();

  if (!session) {
    throw redirect(302, '/');
  }

  const result = await apiClient(fetch).api.crews.get();

  if (!result.data || !result.data.length) {
    throw redirect(302, '/dashboard/create');
  }

  throw redirect(302, `/dashboard/${result.data[0].id}`);
};
