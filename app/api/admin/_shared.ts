import { NextResponse } from 'next/server';
import {
  authConfigFromEnv,
  checkSameOrigin,
  cookiesSecure,
  createSession,
  parseCookieHeader,
  SESSION_COOKIE,
  serializeSessionCookie,
  shouldRenewSession,
  verifySession,
  type SessionPayload,
} from '@/lib/auth';

/** Never cache authenticated admin responses. */
export const NO_STORE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
} as const;

export function jsonNoStore(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: { ...NO_STORE, ...(init?.headers ?? {}) },
  });
}

export function jsonError(status: number, code: string, message: string) {
  return jsonNoStore({ error: { code, message } }, { status });
}

export type Session = { payload: SessionPayload; secret: string };

/** Read + verify the admin session cookie; null when absent/invalid/unconfigured. */
export function readSession(request: Request): Session | null {
  const cfg = authConfigFromEnv();
  if (!cfg.configured) return null;
  const token = parseCookieHeader(request.headers.get('cookie'), SESSION_COOKIE);
  const payload = verifySession(token, cfg.secret, Date.now());
  if (!payload) return null;
  return { payload, secret: cfg.secret };
}

/** Returns a 401 response when there is no valid session, else the session. */
export function requireSession(request: Request): Session | NextResponse {
  const session = readSession(request);
  if (!session) return jsonError(401, 'unauthenticated', 'authentication required');
  return session;
}

/** Returns a 403 response for cross-origin mutations, else null. */
export function guardMutation(request: Request): NextResponse | null {
  const same = checkSameOrigin(request);
  if (!same.ok) return jsonError(403, 'forbidden', same.reason);
  return null;
}

/** Slide the session cookie forward when it is past half its lifetime. */
export function maybeRenewSession(response: NextResponse, session: Session): NextResponse {
  if (!shouldRenewSession(session.payload)) return response;
  const { token } = createSession(session.secret, { now: Date.now(), sid: session.payload.sid });
  response.headers.append('Set-Cookie', serializeSessionCookie(token, { secure: cookiesSecure() }));
  return response;
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}
