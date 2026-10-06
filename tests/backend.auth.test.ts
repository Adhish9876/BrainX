import { describe, expect, it } from 'vitest';
import {
  checkSameOrigin,
  createSession,
  isSameOrigin,
  LoginRateLimiter,
  parseCookieHeader,
  serializeClearCookie,
  serializeSessionCookie,
  shouldRenewSession,
  SESSION_TTL_MS,
  timingSafeEqualStrings,
  verifyCredentials,
  verifySession,
} from '../lib/auth';

const SECRET = 'test-secret-value-1234567890';

describe('timingSafeEqualStrings', () => {
  it('compares equal and unequal values', () => {
    expect(timingSafeEqualStrings('abc', 'abc')).toBe(true);
    expect(timingSafeEqualStrings('abc', 'abd')).toBe(false);
    expect(timingSafeEqualStrings('abc', 'abcd')).toBe(false);
    expect(timingSafeEqualStrings('', '')).toBe(true);
  });
});

describe('verifyCredentials', () => {
  const cfg = { username: 'admin', password: 'correct horse' };

  it('accepts exact credentials', () => {
    expect(verifyCredentials('admin', 'correct horse', cfg)).toBe(true);
  });

  it('rejects wrong username, wrong password and missing values', () => {
    expect(verifyCredentials('nope', 'correct horse', cfg)).toBe(false);
    expect(verifyCredentials('admin', 'nope', cfg)).toBe(false);
    expect(verifyCredentials(undefined, undefined, cfg)).toBe(false);
    expect(verifyCredentials('admin', 'correct horse', { username: 'admin', password: '' })).toBe(false);
  });
});

describe('session tokens', () => {
  it('round-trips a signed session', () => {
    const { token, payload } = createSession(SECRET, { now: 1_000, sid: 'sid-1' });
    const verified = verifySession(token, SECRET, 2_000);
    expect(verified).toEqual(payload);
    expect(verified?.sid).toBe('sid-1');
  });

  it('rejects tampered payloads and signatures', () => {
    const { token } = createSession(SECRET, { now: 1_000 });
    const [encoded, sig] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ sid: 'evil', iat: 0, exp: 9e12 })).toString('base64url');
    expect(verifySession(`${forged}.${sig}`, SECRET, 1_000)).toBeNull();
    expect(verifySession(`${encoded}.${sig}x`, SECRET, 1_000)).toBeNull();
    expect(verifySession('not-a-token', SECRET, 1_000)).toBeNull();
    expect(verifySession(token, 'wrong-secret-value-000000', 1_000)).toBeNull();
  });

  it('expires tokens after the TTL', () => {
    const { token } = createSession(SECRET, { now: 0 });
    expect(verifySession(token, SECRET, SESSION_TTL_MS - 1)).not.toBeNull();
    expect(verifySession(token, SECRET, SESSION_TTL_MS)).toBeNull();
  });

  it('slides renewal past half the lifetime', () => {
    const { payload } = createSession(SECRET, { now: 0 });
    expect(shouldRenewSession(payload, SESSION_TTL_MS / 2 - 1)).toBe(false);
    expect(shouldRenewSession(payload, SESSION_TTL_MS / 2)).toBe(true);
  });
});

describe('cookies', () => {
  it('serialises secure, HttpOnly, SameSite cookies', () => {
    const value = serializeSessionCookie('abc.def', { secure: true, maxAgeSeconds: 60 });
    expect(value).toContain('brainx_admin_session=abc.def');
    expect(value).toContain('HttpOnly');
    expect(value).toContain('SameSite=Lax');
    expect(value).toContain('Secure');
    expect(value).toContain('Path=/');
    expect(serializeClearCookie()).toContain('Max-Age=0');
  });

  it('parses cookie headers', () => {
    expect(parseCookieHeader('a=1; brainx_admin_session=xyz; b=2', 'brainx_admin_session')).toBe('xyz');
    expect(parseCookieHeader('a=1', 'missing')).toBeNull();
    expect(parseCookieHeader(null, 'x')).toBeNull();
  });
});

describe('same-origin guard', () => {
  const req = (method: string, headers: Record<string, string>) => ({
    method,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
  });

  it('allows same-origin mutations and safe methods', () => {
    expect(checkSameOrigin(req('POST', { origin: 'https://brainx.example', host: 'brainx.example' })).ok).toBe(true);
    expect(checkSameOrigin(req('GET', {})).ok).toBe(true);
  });

  it('rejects cross-origin and missing-origin mutations', () => {
    expect(checkSameOrigin(req('POST', { origin: 'https://evil.example', host: 'brainx.example' })).ok).toBe(false);
    expect(checkSameOrigin(req('POST', { host: 'brainx.example' })).ok).toBe(false);
    expect(checkSameOrigin(req('DELETE', { origin: 'https://brainx.example' })).ok).toBe(false);
  });

  it('falls back to Referer and normalises case', () => {
    expect(checkSameOrigin(req('POST', { referer: 'https://BrainX.example/path', host: 'brainx.example' })).ok).toBe(true);
    expect(isSameOrigin('not a url', 'host')).toBe(false);
  });

  it('honours x-forwarded-host as a proxy fallback', () => {
    expect(
      checkSameOrigin(req('POST', { origin: 'https://brainx.example', 'x-forwarded-host': 'brainx.example' })).ok,
    ).toBe(true);
  });
});

describe('LoginRateLimiter', () => {
  it('blocks after the configured number of failures within the window', () => {
    const limiter = new LoginRateLimiter({ max: 3, windowMs: 1_000 });
    expect(limiter.check('ip', 0).blocked).toBe(false);
    limiter.recordFailure('ip', 0);
    limiter.recordFailure('ip', 100);
    limiter.recordFailure('ip', 200);
    const decision = limiter.check('ip', 300);
    expect(decision.blocked).toBe(true);
    expect(decision.retryAfterMs).toBeGreaterThan(0);
    // Window slides: once old failures age out, access is restored.
    expect(limiter.check('ip', 2_000).blocked).toBe(false);
  });

  it('resets on success and is scoped per key', () => {
    const limiter = new LoginRateLimiter({ max: 1, windowMs: 10_000 });
    limiter.recordFailure('a', 0);
    expect(limiter.check('a', 0).blocked).toBe(true);
    expect(limiter.check('b', 0).blocked).toBe(false);
    limiter.reset('a');
    expect(limiter.check('a', 0).blocked).toBe(false);
  });
});
