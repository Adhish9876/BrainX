import { expect, it } from 'vitest';
import { getTree, type GithubConfig } from '../lib/github';

it('refuses truncated GitHub trees rather than reading or deleting partial content', async () => {
  const cfg: GithubConfig = { token: 'test-only', owner: 'o', repo: 'r', branch: 'main', apiBase: 'https://api.github.com' };
  const fakeFetch = async () => new Response(JSON.stringify({ sha: 'abc', tree: [], truncated: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  await expect(getTree(cfg, 'abc', fakeFetch)).rejects.toThrow('file listing is incomplete');
});
