import type { App } from '$lib/server/api/api';

import { treaty } from '@elysiajs/eden';

const apiClient = (customFetch: typeof fetch = fetch) =>
  treaty<App>('', {
    // @ts-expect-error fetcher is not properly typed
    fetcher: (url, options) => {
      let modifiedUrl: RequestInfo | URL = url;
      if (typeof url === 'string') {
        modifiedUrl = url.replace('https:/', '');
      } else if (url instanceof URL) {
        modifiedUrl = new URL(url.toString().replace('https:/', ''));
      }
      return customFetch(modifiedUrl, options);
    }
  });

export { apiClient };
