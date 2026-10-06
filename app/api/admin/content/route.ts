import { NextResponse } from 'next/server';
import { GitHubError, githubConfigFromEnv, isGithubConfigured, readRemoteContent } from '@/lib/github';
import { jsonError, jsonNoStore, requireSession } from '../_shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = requireSession(request);
  if (session instanceof NextResponse) return session;

  const cfg = githubConfigFromEnv();
  if (!isGithubConfigured(cfg)) {
    return jsonError(503, 'unavailable', 'GitHub is not configured');
  }

  try {
    const { content, sha } = await readRemoteContent(cfg);
    return jsonNoStore({ content, sha });
  } catch (error) {
    if (error instanceof GitHubError && error.status === 409) {
      return jsonError(409, 'conflict', 'remote content changed');
    }
    return jsonError(502, 'github_error', 'failed to read remote content');
  }
}
