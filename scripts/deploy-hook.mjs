#!/usr/bin/env node
/**
 * BrainX Lab deploy hook.
 *
 * A tiny, dependency-free loopback HTTP server that lets GitHub Actions (via
 * Caddy at https://brainx.zapdos.me/__deploy) trigger a production deployment
 * on the VPS, and lets CI poll for the resulting live revision.
 *
 * Routes (all require `Authorization: Bearer <DEPLOY_SECRET>`):
 *   POST /__deploy            body {"sha":"<40hex>","repository":"o/r","branch":"main"}
 *                             -> 202 accepted / 200 already-live
 *   GET  /__deploy            -> 200 {"liveSha":...,"deploying":...,"error":...}
 *   GET  /__deploy/status     -> same as above
 *
 * Design notes:
 *   * Reads its configuration (including DEPLOY_SECRET and GITHUB_PAT) from the
 *     shared env file on every request, so rotated secrets are picked up
 *     without a restart.
 *   * Deployments are serialized; concurrent requests are coalesced to the
 *     single most-recently requested SHA.
 *   * The child deploy script is spawned with an argument array (never a
 *     shell), and the SHA is validated first, so command injection is not
 *     possible.
 *   * Secrets are never written to logs or responses; error strings returned
 *     by the status endpoint are sanitized and redacted.
 */
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const BASE_DIR = process.env.BRAINX_BASE_DIR || '/home/ubuntu/brainx-lab';
const HOST = process.env.HOOK_HOST || '127.0.0.1';
const PORT = Number.parseInt(process.env.HOOK_PORT || '3102', 10);
const ENV_FILE = process.env.BRAINX_ENV_FILE || path.join(BASE_DIR, 'shared', '.env.local');
const DEPLOY_SCRIPT = process.env.BRAINX_DEPLOY_SCRIPT || path.join(BASE_DIR, 'deploy-vps.sh');
const STATE_FILE = process.env.BRAINX_HOOK_STATE || path.join(BASE_DIR, 'shared', 'hook-state.json');
const LOG_FILE = process.env.BRAINX_DEPLOY_LOG || path.join(BASE_DIR, 'shared', 'deploy.log');
const CURRENT_LINK = path.join(BASE_DIR, 'current');
const DEPLOY_TIMEOUT_MS = Number.parseInt(
  process.env.BRAINX_DEPLOY_TIMEOUT_MS || String(20 * 60 * 1000),
  10,
);
const MAX_BODY_BYTES = 8 * 1024;
const MAX_ERROR_LEN = 300;

export const SHA_RE = /^[0-9a-f]{40}$/;

// ---------------------------------------------------------------------------
// Pure helpers (exported for unit tests)
// ---------------------------------------------------------------------------
/**
 * @param {string} [text]
 * @returns {Record<string, string>}
 */
export function parseEnvFile(text) {
  const out = {};
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    let line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('export ')) line = line.slice('export '.length).trim();
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"') && val.length >= 2) ||
      (val.startsWith("'") && val.endsWith("'") && val.length >= 2)
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

/**
 * @param {string} [file]
 * @returns {Record<string, string>}
 */
export function readEnv(file = ENV_FILE) {
  try {
    return parseEnvFile(fs.readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidSha(value) {
  return typeof value === 'string' && SHA_RE.test(value);
}

/**
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length === 0 || ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * @param {unknown} header
 * @param {unknown} secret
 * @returns {boolean}
 */
export function validateBearer(header, secret) {
  if (typeof header !== 'string' || !secret) return false;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return false;
  return safeEqual(match[1].trim(), secret);
}

/**
 * @param {unknown} text
 * @param {string[]} [redactions]
 * @returns {string|null}
 */
export function sanitizeError(text, redactions = []) {
  let s = String(text ?? '');
  for (const secret of redactions) {
    if (secret && secret.length >= 4) s = s.split(secret).join('***');
  }
  s = s.replace(/\r/g, '').replace(/\n+/g, ' ').trim();
  s = s.split(BASE_DIR).join('~');
  if (s.length > MAX_ERROR_LEN) s = s.slice(s.length - MAX_ERROR_LEN);
  return s || null;
}

/**
 * @param {string} [link]
 * @returns {string|null}
 */
export function liveShaFromLink(link = CURRENT_LINK) {
  try {
    const base = path.basename(fs.realpathSync(link));
    return isValidSha(base) ? base : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Deploy queue state
// ---------------------------------------------------------------------------
const state = {
  deploying: false,
  runningSha: null,
  pendingSha: null,
  error: null,
  startedAt: null,
  finishedAt: null,
};

function loadState() {
  try {
    const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (saved && typeof saved === 'object') {
      state.error = typeof saved.error === 'string' ? saved.error : null;
      state.finishedAt = typeof saved.finishedAt === 'string' ? saved.finishedAt : null;
    }
  } catch {
    /* no prior state */
  }
}

function persistState() {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    const snapshot = {
      liveSha: liveShaFromLink(),
      deploying: state.deploying,
      runningSha: state.runningSha,
      pendingSha: state.pendingSha,
      error: state.error,
      startedAt: state.startedAt,
      finishedAt: state.finishedAt,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(snapshot, null, 2));
  } catch {
    /* best effort */
  }
}

function tailMeaningful(buffer) {
  const lines = String(buffer ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.length ? lines[lines.length - 1] : '';
}

/**
 * Start a deployment for `sha`. Assumes no deployment is currently running.
 * Not exported: unit tests exercise the pure helpers, not process spawning.
 */
function runDeploy(sha, redactions) {
  state.deploying = true;
  state.runningSha = sha;
  state.startedAt = new Date().toISOString();
  state.finishedAt = null;
  state.error = null;
  persistState();

  let logStream;
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
    logStream.write(`\n=== deploy ${sha} start ${new Date().toISOString()} ===\n`);
  } catch {
    logStream = null;
  }

  let output = '';
  let settled = false;

  const child = spawn('/bin/bash', [DEPLOY_SCRIPT, sha], {
    cwd: BASE_DIR,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const timer = setTimeout(() => {
    console.error(`[hook] deploy ${sha.slice(0, 12)} timed out after ${DEPLOY_TIMEOUT_MS}ms; killing`);
    try {
      child.kill('SIGKILL');
    } catch {
      /* ignore */
    }
  }, DEPLOY_TIMEOUT_MS);

  const onData = (chunk) => {
    const text = chunk.toString();
    output = (output + text).slice(-8000);
    if (logStream) logStream.write(text);
  };
  child.stdout?.on('data', onData);
  child.stderr?.on('data', onData);

  const finish = (code, spawnError) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    if (logStream) {
      logStream.write(`=== deploy ${sha} exit ${code ?? 'error'} ${new Date().toISOString()} ===\n`);
      logStream.end();
    }

    state.deploying = false;
    state.runningSha = null;
    state.finishedAt = new Date().toISOString();

    const live = liveShaFromLink();
    if (!spawnError && code === 0 && live === sha) {
      state.error = null;
    } else if (!spawnError && code === 0) {
      // Script exited 0 but the symlink does not match (e.g. rolled back).
      state.error = `deploy script exited 0 but live sha is ${live ? live.slice(0, 12) : 'unknown'}`;
    } else {
      const detail = spawnError ? String(spawnError.message || spawnError) : tailMeaningful(output);
      state.error = sanitizeError(detail || `deploy exited with code ${code}`, redactions);
    }
    persistState();

    // Drain the coalesced queue.
    const next = state.pendingSha;
    state.pendingSha = null;
    if (next && isValidSha(next) && next !== liveShaFromLink()) {
      runDeploy(next, redactions);
    }
  };

  child.on('error', (err) => finish(null, err));
  child.on('close', (code) => finish(code, null));
}

// ---------------------------------------------------------------------------
// HTTP handling
// ---------------------------------------------------------------------------
function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req, limit = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function statusPayload(env) {
  return {
    ok: true,
    liveSha: liveShaFromLink(),
    deploying: state.deploying,
    runningSha: state.runningSha,
    pendingSha: state.pendingSha,
    error: state.error,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    updatedAt: new Date().toISOString(),
    repository: env.GITHUB_OWNER && env.GITHUB_REPO ? `${env.GITHUB_OWNER}/${env.GITHUB_REPO}` : null,
    branch: env.GITHUB_BRANCH || 'main',
  };
}

function redactionsFor(env) {
  return [env.DEPLOY_SECRET, env.GITHUB_PAT].filter(Boolean);
}

export function createRequestHandler({ readEnvFn = readEnv } = {}) {
  return async function handler(req, res) {
    const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';

    if (pathname !== '/__deploy' && pathname !== '/__deploy/status') {
      return sendJson(res, 404, { ok: false, error: 'not found' });
    }

    const env = readEnvFn();
    const secret = env.DEPLOY_SECRET;
    if (!secret) {
      return sendJson(res, 503, { ok: false, error: 'deploy hook is not configured' });
    }
    if (!validateBearer(req.headers.authorization, secret)) {
      console.error(`[hook] unauthorized ${req.method} ${pathname}`);
      return sendJson(res, 401, { ok: false, error: 'unauthorized' });
    }

    if (req.method === 'GET') {
      return sendJson(res, 200, statusPayload(env));
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return sendJson(res, 405, { ok: false, error: 'method not allowed' });
    }

    let body;
    try {
      const raw = await readBody(req);
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return sendJson(res, 400, { ok: false, error: 'invalid JSON body' });
    }

    const sha = body && body.sha;
    if (!isValidSha(sha)) {
      return sendJson(res, 400, { ok: false, error: 'invalid or missing sha (expected 40 lowercase hex)' });
    }

    const expectedRepo =
      env.GITHUB_OWNER && env.GITHUB_REPO ? `${env.GITHUB_OWNER}/${env.GITHUB_REPO}` : null;
    if (body.repository && expectedRepo && body.repository !== expectedRepo) {
      return sendJson(res, 403, { ok: false, error: 'repository mismatch' });
    }
    const expectedBranch = env.GITHUB_BRANCH || 'main';
    if (body.branch && body.branch !== expectedBranch) {
      return sendJson(res, 403, { ok: false, error: 'branch mismatch' });
    }

    const live = liveShaFromLink();
    if (!state.deploying && live === sha) {
      return sendJson(res, 200, { ok: true, status: 'already-live', sha, ...statusPayload(env) });
    }

    let coalesced = false;
    if (state.deploying) {
      state.pendingSha = sha;
      coalesced = true;
      console.log(`[hook] deploy in progress (${state.runningSha?.slice(0, 12)}); queued ${sha.slice(0, 12)}`);
      persistState();
    } else {
      console.log(`[hook] accepted deploy ${sha.slice(0, 12)}`);
      runDeploy(sha, redactionsFor(env));
    }

    return sendJson(res, 202, {
      ok: true,
      accepted: true,
      coalesced,
      sha,
      ...statusPayload(env),
    });
  };
}

// ---------------------------------------------------------------------------
// Server bootstrap
// ---------------------------------------------------------------------------
export function startServer() {
  loadState();
  if (!fs.existsSync(DEPLOY_SCRIPT)) {
    console.error(`[hook] WARNING: deploy script not found at ${DEPLOY_SCRIPT}`);
  }
  const server = http.createServer(createRequestHandler());
  server.on('error', (err) => {
    console.error(`[hook] server error: ${err.message}`);
  });
  server.listen(PORT, HOST, () => {
    console.log(`[hook] listening on http://${HOST}:${PORT} (base ${BASE_DIR})`);
  });
  return server;
}

const argvPath = process.argv[1];
const isMain =
  typeof argvPath === 'string' &&
  (() => {
    try {
      return fs.realpathSync(argvPath) === fs.realpathSync(fileURLToPath(import.meta.url));
    } catch {
      return false;
    }
  })();

// PM2 imports the entry module through its process container, so argv[1] is
// not necessarily this filename. Explicit opt-in keeps test imports inert.
if (isMain || process.env.BRAINX_HOOK_AUTOSTART === '1') {
  startServer();
}

export { pathToFileURL };
