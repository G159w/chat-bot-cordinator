import { getRequestEvent } from '$app/server';
import { treaty } from '@elysiajs/eden';

import { app } from './server/api/api';

export const getServerApiClient = () => {
  const { cookies } = getRequestEvent();
  const token = cookies.get('authjs.session-token');
  return treaty(app, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
