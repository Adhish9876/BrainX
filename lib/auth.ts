import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Server-side authentication for the hidden admin area.
 *
 * Intentionally free of `next/*` imports so the primitives (credential check,
 * session token, cookie serialisation, rate limiting, same-origin guard) are
 * unit-testable in isolation. Route handlers do the HTTP plumbing.
 *
 * Security properties:
 *  - credentials are compared in constant time (both fields always compared);
 *  - sessions are HMAC-SHA256 signed, HttpOnly, SameSite=Lax and Secure in prod;
 *  - the token carries an absolute expiry and slides on activity (7 days);
 *  - login attempts are rate limited per client key;
 *  - mutating requests must be same-origin.
 */

export const SESSION_COOKIE = 'brainx_admin_session';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Renew the cookie once the session is past half its lifetime. */
export const SESSION_RENEW_AFTER_MS = SESSION_TTL_MS / 2;
export const AUTH_MIN_SECRET_LENGTH = 16;

export type SessionPayload = {
  /** Stable session id, also used to bind staged uploads. */
  sid: string;
  /** Issued-at (ms epoch). */
  iat: number;
  /** Expiry (ms epoch). */
  exp: number;
};

export type AuthConfig = {
  username: string;
  password: string;
  secret: string;
  configured: boolean;
};

export function authConfigFromEnv(env: NodeJS.ProcessEnv = process.env): AuthConfig {
  const username = env.ADMIN_USERNAME ?? '';
  const password = env.ADMIN_PASSWORD ?? '';
  const secret = env.SESSION_SECRET ?? '';
  const configured = password.length > 0 && secret.length >= AUTH_MIN_SECRET_LENGTH;
  return { username, password, secret, configured };
}

// ---------------------------------------------------------------------------
// Constant-time comparison
// ---------------------------------------------------------------------------

/**
 * Constant-time string comparison. Lengths are masked by hashing both inputs,
 * so unequal lengths do not short-circuit.
 */
export function timingSafeEqualStrings(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a, 'utf8').digest();
  const hb = createHash('sha256').update(b, 'utf8').digest();
  return timingSafeEqual(ha, hb);
}

export function verifyCredentials(
  username: unknown,
  password: unknown,
  cfg: Pick<AuthConfig, 'username' | 'password'>,
): boolean {
  const user = typeof username === 'string' ? username : '';
  const pass = typeof password === 'string' ? password : '';
  // Evaluate both comparisons so neither reveals which field failed.
  const userOk = timingSafeEqualStrings(user, cfg.username);
  const passOk = timingSafeEqualStrings(pass, cfg.password);
  const hasCreds = cfg.password.length > 0;
  return hasCreds && userOk && passOk;
}

// ---------------------------------------------------------------------------
// Session tokens
// ---------------------------------------------------------------------------

function sign(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function encodePayload(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function newSessionId(): string {
  return randomBytes(16).toString('hex');
}

/** Create a signed session token. `ttlMs` defaults to 7 days. */
export function createSession(
  secret: string,
  options: { now?: number; ttlMs?: number; sid?: string } = {},
): { token: string; payload: SessionPayload } {
  const now = options.now ?? Date.now();
  const ttlMs = options.ttlMs ?? SESSION_TTL_MS;
  const payload: SessionPayload = {
    sid: options.sid ?? newSessionId(),
    iat: now,
    exp: now + ttlMs,
  };
  const encoded = encodePayload(payload);
  return { token: `${encoded}.${sign(secret, encoded)}`, payload };
}

/** Verify signature and expiry. Returns the payload or null. */
export function verifySession(
  token: string | null | undefined,
  secret: string,
  now: number = Date.now(),
): SessionPayload | null {
  if (!token || !secret) return null;
  const dot = token.indexOf('.');
  if (dot <= 0 || dot === token.length - 1) return null;
  const encoded = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(secret, encoded);
  if (!timingSafeEqualStrings(signature, expected)) return null;
  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
  } catch {
    return null;
  }
  if (
    !payload ||
    typeof payload.sid !== 'string' ||
    typeof payload.iat !== 'number' ||
    typeof payload.exp !== 'number'
  ) {
    return null;
  }
  if (payload.exp <= now) return null;
  return payload;
}

/** True when an active session should be re-issued to extend its lifetime. */
export function shouldRenewSession(
  payload: SessionPayload,
  now: number = Date.now(),
  renewAfterMs: number = SESSION_RENEW_AFTER_MS,
): boolean {
  return now - payload.iat >= renewAfterMs;
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

export function serializeSessionCookie(
  token: string,
  options: { maxAgeSeconds?: number; secure?: boolean } = {},
): string {
  const maxAge = options.maxAgeSeconds ?? Math.floor(SESSION_TTL_MS / 1000);
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
}

export function serializeClearCookie(options: { secure?: boolean } = {}): string {
  const parts = [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
}

export function parseCookieHeader(header: string | null | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    if (key !== name) continue;
    const raw = part.slice(eq + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
}

/** Whether cookies should carry the `Secure` attribute. */
export function cookiesSecure(env: NodeJS.ProcessEnv = process.env): boolean {
  return (env.NODE_ENV ?? 'development') === 'production';
}

// ---------------------------------------------------------------------------
// Same-origin guard for mutating requests
// ---------------------------------------------------------------------------

export function isSameOrigin(origin: string | null | undefined, host: string | null | undefined): boolean {
  if (!origin || !host) return false;
  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

export type SameOriginResult = { ok: true } | { ok: false; reason: string };

type MinimalRequest = {
  method: string;
  headers: { get(name: string): string | null };
};

/**
 * For mutating methods, require an Origin (falling back to Referer) that
 * matches the request Host. Safe methods are always allowed.
 */
export function checkSameOrigin(request: MinimalRequest): SameOriginResult {
  const method = (request.method ?? 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return { ok: true };
  const host = request.headers.get('host') ?? request.headers.get('x-forwarded-host');
  const origin = request.headers.get('origin') ?? request.headers.get('referer');
  if (!host) return { ok: false, reason: 'missing host' };
  if (!origin) return { ok: false, reason: 'missing origin' };
  if (!isSameOrigin(origin, host)) return { ok: false, reason: 'cross-origin request rejected' };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Login rate limiting (in-memory, per server process)
// ---------------------------------------------------------------------------

export type RateLimitDecision = { blocked: boolean; retryAfterMs: number };

export class LoginRateLimiter {
  private readonly failures = new Map<string, number[]>();

  constructor(
    private readonly options: { max?: number; windowMs?: number } = {},
  ) {}

  get max(): number {
    return this.options.max ?? 8;
  }

  get windowMs(): number {
    return this.options.windowMs ?? 15 * 60 * 1000;
  }

  private prune(key: string, now: number): number[] {
    const windowStart = now - this.windowMs;
    const recent = (this.failures.get(key) ?? []).filter((ts) => ts > windowStart);
    if (recent.length === 0) this.failures.delete(key);
    else this.failures.set(key, recent);
    return recent;
  }

  check(key: string, now: number = Date.now()): RateLimitDecision {
    const recent = this.prune(key, now);
    if (recent.length < this.max) return { blocked: false, retryAfterMs: 0 };
    const oldest = recent[0];
    return { blocked: true, retryAfterMs: Math.max(0, oldest + this.windowMs - now) };
  }

  recordFailure(key: string, now: number = Date.now()): void {
    const recent = this.prune(key, now);
    recent.push(now);
    this.failures.set(key, recent);
  }

  reset(key: string): void {
    this.failures.delete(key);
  }

  clear(): void {
    this.failures.clear();
  }
}

/** Shared limiter used by the login route. */
export const loginRateLimiter = new LoginRateLimiter();
