import type { App } from '$lib/server/api/api';

import { browser } from '$app/environment';
import { base } from '$app/paths';
import { treaty } from '@elysiajs/eden';

// Get the base URL from the sveltekit fetch client
const getBaseUrl = () => {
	if (browser) {
		// In the browser, we can use window.location
		return window.location.origin;
	} else {
		// On the server, we need to use environment variables
		// This is what SvelteKit's fetch uses internally
		return process.env.ORIGIN || 'http://localhost:5173';
	}
};

const getBaseUrlWithPath = () => {
	const origin = getBaseUrl();
	return origin + base; // base is from $app/paths
};

/**
 * Get the base URL that SvelteKit's fetch uses internally
 * This replicates the same logic that SvelteKit uses to resolve relative URLs
 */
function getSvelteKitBaseUrl(): string {
	if (browser) {
		// In the browser, use the current origin
		return window.location.origin;
	} else {
		// On the server, use the ORIGIN environment variable
		// This is exactly what SvelteKit's fetch does
		return process.env.ORIGIN || 'http://localhost:5173';
	}
}

const apiClient = treaty<App>('', {
	// @ts-expect-error fetcher is not properly typed
	fetcher: (url, options) => {
		let modifiedUrl: RequestInfo | URL = url;
		if (typeof url === 'string') {
			modifiedUrl = url.replace('https:/', '');
		} else if (url instanceof URL) {
			modifiedUrl = new URL(url.toString().replace('https:/', ''));
		}
		return fetch(modifiedUrl, options);
	}
});

export { apiClient, getBaseUrl, getBaseUrlWithPath, getSvelteKitBaseUrl };
