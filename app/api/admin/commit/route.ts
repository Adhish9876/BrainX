import { NextResponse } from 'next/server';
import {
  collectStagedTokens,
  commitContent,
  GitHubConflictError,
  GitHubError,
  githubConfigFromEnv,
  isGithubConfigured,
} from '@/lib/github';
import { deleteUpload, loadStagedForSession, UploadError, uploadDir } from '@/lib/uploads';
import { LIMITS, validateContent } from '@/lib/validation';
import { guardMutation, jsonError, jsonNoStore, requireSession } from '../_shared';
import { BodyTooLargeError, readLimitedBody } from '@/lib/request-body';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const guard = guardMutation(request);
  if (guard) return guard;

  const session = requireSession(request);
  if (session instanceof NextResponse) return session;

  const cfg = githubConfigFromEnv();
  if (!isGithubConfigured(cfg)) {
    return jsonError(503, 'unavailable', 'GitHub is not configured');
  }

  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (declaredLength && declaredLength > LIMITS.contentBytes) {
    return jsonError(413, 'payload_too_large', 'content payload too large');
  }

  let body: unknown;
  try {
    body = JSON.parse((await readLimitedBody(request, LIMITS.contentBytes)).toString('utf8'));
  } catch (error) {
    if (error instanceof BodyTooLargeError) return jsonError(413, 'payload_too_large', 'content payload too large');
    return jsonError(400, 'bad_request', 'invalid JSON body');
  }

  const baseSha = (body as { baseSha?: unknown })?.baseSha;
  if (typeof baseSha !== 'string' || baseSha.length === 0) {
    return jsonError(400, 'bad_request', 'baseSha is required');
  }

  const validation = validateContent((body as { content?: unknown })?.content);
  if (!validation.ok) {
    return jsonNoStore(
      { error: { code: 'invalid_content', message: 'content failed validation', issues: validation.issues } },
      { status: 400 },
    );
  }

  const content = validation.content;
  const tokens = collectStagedTokens(content);
  const dir = uploadDir();

  let staged: Map<string, Buffer>;
  try {
    staged = await loadStagedForSession(dir, tokens, session.payload.sid);
  } catch (error) {
    if (error instanceof UploadError) return jsonError(error.status, 'invalid_upload', error.message);
    return jsonError(400, 'invalid_upload', 'staged upload could not be loaded');
  }

  try {
    const result = await commitContent(cfg, content, { baseSha, staged });
    await Promise.all([...tokens].map((token) => deleteUpload(dir, token)));
    return jsonNoStore({ sha: result.sha, url: result.url, message: result.message, content: result.content });
  } catch (error) {
    if (error instanceof GitHubConflictError) {
      return jsonError(409, 'conflict', 'remote content changed; reload and retry');
    }
    if (error instanceof UploadError) {
      return jsonError(error.status, 'invalid_upload', error.message);
    }
    if (error instanceof GitHubError && error.status >= 400 && error.status < 500) {
      return jsonError(error.status, 'github_error', 'commit rejected');
    }
    return jsonError(502, 'github_error', 'failed to commit');
  }
}
