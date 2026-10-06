import {
  authConfigFromEnv,
  cookiesSecure,
  createSession,
  loginRateLimiter,
  serializeSessionCookie,
  verifyCredentials,
} from '@/lib/auth';
import { clientKey, guardMutation, jsonError, jsonNoStore } from '../_shared';
import { BodyTooLargeError, readLimitedBody } from '@/lib/request-body';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const guard = guardMutation(request);
  if (guard) return guard;

  const cfg = authConfigFromEnv();
  if (!cfg.configured) {
    return jsonError(503, 'unavailable', 'admin authentication is not configured');
  }

  const key = clientKey(request);
  const now = Date.now();

  const decision = loginRateLimiter.check(key, now);
  if (decision.blocked) {
    const response = jsonError(429, 'rate_limited', 'too many login attempts');
    response.headers.set('Retry-After', String(Math.max(1, Math.ceil(decision.retryAfterMs / 1000))));
    return response;
  }

  let body: unknown;
  try {
    body = JSON.parse((await readLimitedBody(request, 8192)).toString('utf8'));
  } catch (error) {
    if (error instanceof BodyTooLargeError) return jsonError(413, 'payload_too_large', 'login payload too large');
    return jsonError(400, 'bad_request', 'invalid JSON body');
  }

  const username = (body as { username?: unknown })?.username;
  const password = (body as { password?: unknown })?.password;
  if (typeof username !== 'string' || typeof password !== 'string') {
    return jsonError(400, 'bad_request', 'username and password are required');
  }

  if (!verifyCredentials(username, password, cfg)) {
    loginRateLimiter.recordFailure(key, now);
    return jsonError(401, 'invalid_credentials', 'invalid credentials');
  }

  loginRateLimiter.reset(key);
  const { token } = createSession(cfg.secret, { now });

  const response = jsonNoStore({ authenticated: true });
  response.headers.append('Set-Cookie', serializeSessionCookie(token, { secure: cookiesSecure() }));
  return response;
}
