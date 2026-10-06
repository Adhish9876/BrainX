import { describe, expect, it } from 'vitest';
import {
  isValidSha,
  parseEnvFile,
  safeEqual,
  sanitizeError,
  validateBearer,
} from '../scripts/deploy-hook.mjs';

// Note: importing the hook module must not start the HTTP server (it only
// listens when executed as the main module), so these tests stay hermetic.

const VALID_SHA = 'a'.repeat(40);

describe('isValidSha', () => {
  it('accepts a 40-char lowercase hex sha', () => {
    expect(isValidSha(VALID_SHA)).toBe(true);
    expect(isValidSha('0123456789abcdef0123456789abcdef01234567')).toBe(true);
  });

  it('rejects malformed sha values', () => {
    expect(isValidSha('')).toBe(false);
    expect(isValidSha('A'.repeat(40))).toBe(false); // uppercase
    expect(isValidSha('a'.repeat(39))).toBe(false); // too short
    expect(isValidSha('a'.repeat(41))).toBe(false); // too long
    expect(isValidSha('g'.repeat(40))).toBe(false); // non-hex
    expect(isValidSha('HEAD')).toBe(false);
    expect(isValidSha('a'.repeat(40) + '; rm -rf /')).toBe(false);
    // Runtime guards accept unknown input and return false.
    expect(isValidSha(1234)).toBe(false);
    expect(isValidSha(null)).toBe(false);
  });
});

describe('parseEnvFile', () => {
  it('parses keys, values, comments, blanks and quotes', () => {
    const env = parseEnvFile(
      [
        '# a comment',
        '',
        'GITHUB_OWNER=zapds',
        'GITHUB_PAT = abc123 ',
        'DEPLOY_SECRET="quoted-secret"',
        "SESSION_SECRET='single-quoted'",
        '  SPACED_KEY=value  ',
        'INVALID KEY=value',
        'NO_EQUALS',
      ].join('\n'),
    );
    expect(env.GITHUB_OWNER).toBe('zapds');
    expect(env.GITHUB_PAT).toBe('abc123');
    expect(env.DEPLOY_SECRET).toBe('quoted-secret');
    expect(env.SESSION_SECRET).toBe('single-quoted');
    expect(env.SPACED_KEY).toBe('value');
    expect(env['INVALID KEY']).toBeUndefined();
    expect(env.NO_EQUALS).toBeUndefined();
  });

  it('keeps the last assignment when a key repeats', () => {
    const env = parseEnvFile('FOO=one\nFOO=two\n');
    expect(env.FOO).toBe('two');
  });

  it('handles empty and undefined input', () => {
    expect(parseEnvFile('')).toEqual({});
    expect(parseEnvFile(undefined)).toEqual({});
  });

  it('tolerates a leading export keyword', () => {
    const env = parseEnvFile('export GITHUB_PAT=abc\nexport DEPLOY_SECRET="s"\n');
    expect(env.GITHUB_PAT).toBe('abc');
    expect(env.DEPLOY_SECRET).toBe('s');
  });

  it('does not execute or interpolate values', () => {
    const env = parseEnvFile('EVIL=$(touch /tmp/pwned)\nCMD=`id`\n');
    expect(env.EVIL).toBe('$(touch /tmp/pwned)');
    expect(env.CMD).toBe('`id`');
  });
});

describe('safeEqual', () => {
  it('compares equal strings', () => {
    expect(safeEqual('secret', 'secret')).toBe(true);
  });

  it('rejects different strings and lengths', () => {
    expect(safeEqual('secret', 'secreT')).toBe(false);
    expect(safeEqual('secret', 'secret-longer')).toBe(false);
    expect(safeEqual('', '')).toBe(false);
  });
});

describe('validateBearer', () => {
  const secret = 'super-secret-token';

  it('accepts matching bearer tokens', () => {
    expect(validateBearer(`Bearer ${secret}`, secret)).toBe(true);
    expect(validateBearer(`bearer ${secret}`, secret)).toBe(true);
    expect(validateBearer(`  Bearer   ${secret}  `, secret)).toBe(true);
  });

  it('rejects missing, malformed or wrong tokens', () => {
    expect(validateBearer(undefined, secret)).toBe(false);
    expect(validateBearer('', secret)).toBe(false);
    expect(validateBearer(secret, secret)).toBe(false); // no scheme
    expect(validateBearer(`Basic ${secret}`, secret)).toBe(false);
    expect(validateBearer('Bearer wrong', secret)).toBe(false);
    expect(validateBearer(`Bearer ${secret}`, '')).toBe(false);
  });
});

describe('sanitizeError', () => {
  it('redacts provided secrets and scrubs the base directory', () => {
    const out = sanitizeError(
      'fatal: /home/ubuntu/brainx-lab/releases/abc token=leaked-token',
      ['leaked-token'],
    );
    expect(out).not.toContain('leaked-token');
    expect(out).toContain('***');
    expect(out).not.toContain('/home/ubuntu/brainx-lab');
    expect(out).toContain('~');
  });

  it('collapses newlines and trims', () => {
    const out = sanitizeError('line one\n\nline two\n');
    expect(out).toBe('line one line two');
  });

  it('bounds length and returns null for empty input', () => {
    const out = sanitizeError('x'.repeat(1000));
    expect(out).not.toBeNull();
    expect((out as string).length).toBe(300);
    expect(sanitizeError('')).toBeNull();
    expect(sanitizeError(undefined)).toBeNull();
  });

  it('does not redact very short secrets', () => {
    const out = sanitizeError('abc', ['ab']);
    expect(out).toBe('abc');
  });
});
