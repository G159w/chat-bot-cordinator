import { app } from '$lib/server/api/api';

type RequestHandler = (v: { request: Request }) => Promise<Response> | Response;

function handleRequest(request: Request) {
  const cookies = parseCookies(request.headers.get('cookie') ?? '');
  const token = cookies['authjs.session-token'];

  if (token) {
    request.headers.set('authorization', `Bearer ${token}`);
  }

  return app.handle(request);
}

function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  if (!cookieString) return cookies;

  // Split by semicolon and trim whitespace
  const cookiePairs = cookieString.split(';').map((pair) => pair.trim());

  for (const pair of cookiePairs) {
    // Find the first equals sign
    const equalsIndex = pair.indexOf('=');
    if (equalsIndex === -1) continue;

    const name = pair.substring(0, equalsIndex).trim();
    const value = pair.substring(equalsIndex + 1).trim();

    // Decode the value (handles URL encoding)
    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      // If decoding fails, use the raw value
      cookies[name] = value;
    }
  }

  return cookies;
}

export const GET: RequestHandler = ({ request }) => handleRequest(request);
export const POST: RequestHandler = ({ request }) => handleRequest(request);
export const PUT: RequestHandler = ({ request }) => handleRequest(request);
export const DELETE: RequestHandler = ({ request }) => handleRequest(request);
export const PATCH: RequestHandler = ({ request }) => handleRequest(request);
export const HEAD: RequestHandler = ({ request }) => handleRequest(request);
