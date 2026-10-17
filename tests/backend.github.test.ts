import { describe, expect, it } from 'vitest';
import {
  collectStagedTokens,
  commitContent,
  dataPathFromMediaUrl,
  gitBlobSha,
  GitHubConflictError,
  GitHubError,
  mediaUrlFromDataPath,
  planCommit,
  stagedTokenFromUrl,
  type GithubConfig,
  type TreeEntry,
} from '../lib/github';
import type { Content } from '../lib/types';

const T1 = 'a'.repeat(32);
const T2 = 'b'.repeat(32);
const STAGED_1 = `/api/admin/uploads/${T1}`;
const STAGED_2 = `/api/admin/uploads/${T2}`;

function makeContent(): Content {
  return {
    site: {
      name: 'BrainX Lab',
      institution: '',
      tagline: '',
      about: '',
      focus: '',
      email: '',
      phone: '',
      address: '',
      logo: '',
    },
    publications: [],
    team: [],
    research: [],
    projects: [],
    news: [],
    events: [],
    pictures: [],
  };
}

function entry(path: string, sha: string): TreeEntry {
  return { path, sha, mode: '100644', type: 'blob' };
}

describe('pure github helpers', () => {
  it('computes git blob shas', () => {
    // Well-known empty blob object id.
    expect(gitBlobSha(Buffer.from(''))).toBe('e69de29bb2d1d6434b8b29ae775ad8c2e48c5391');
  });

  it('round-trips media and data paths', () => {
    expect(dataPathFromMediaUrl('/media/pictures/g/a.webp')).toBe('data/pictures/g/a.webp');
    expect(dataPathFromMediaUrl('/media/uploads/x.webp')).toBe('data/uploads/x.webp');
    expect(dataPathFromMediaUrl('https://x/y')).toBeNull();
    expect(mediaUrlFromDataPath('data/uploads/x.webp')).toBe('/media/uploads/x.webp');
  });

  it('extracts staged upload tokens', () => {
    expect(stagedTokenFromUrl(STAGED_1)).toBe(T1);
    expect(stagedTokenFromUrl('/media/uploads/x.webp')).toBeNull();
    expect(stagedTokenFromUrl('/api/admin/uploads/short')).toBeNull();
  });

  it('collects staged tokens from image fields (Event has image, News does not)', () => {
    const content = makeContent();
    content.site.logo = STAGED_1;
    content.events = [
      { id: 'e1', title: 't', date: '', description: '', tags: [], link: '', image: STAGED_2, time: '', venue: '' },
    ];
    const tokens = collectStagedTokens(content);
    expect(tokens.has(T1)).toBe(true);
    expect(tokens.has(T2)).toBe(true);
  });
});

describe('planCommit', () => {
  const oldEntries: TreeEntry[] = [
    entry('data/pictures/demo-gallery/demo-01.png', 's1'),
    entry('data/pictures/demo-gallery/demo-02.png', 's2'),
    entry('data/pictures/demo-gallery/meta.json', 'sm'),
    entry('data/pictures/old-group/x.png', 'sx'),
    entry('data/pictures/old-group/meta.json', 'so'),
    entry('data/uploads/keepme.webp', 'sk'),
    entry('data/README.md', 'sr'),
    entry('docs/notes.txt', 'sd'),
  ];

  function galleryContent(): Content {
    const content = makeContent();
    content.site.logo = STAGED_2;
    content.pictures = [
      {
        id: 'demo-gallery',
        name: 'Demo',
        date: '',
        description: 'd',
        thumbnail: '/media/pictures/demo-gallery/demo-02.webp',
        images: [
          '/media/pictures/demo-gallery/demo-01.webp',
          '/media/pictures/demo-gallery/demo-02.webp',
          STAGED_1,
        ],
      },
    ];
    return content;
  }

  const staged = new Map<string, Buffer>([
    [T1, Buffer.from('webp-1')],
    [T2, Buffer.from('webp-2')],
  ]);

  it('writes json, meta, images and rewrites staged urls', () => {
    const plan = planCommit(galleryContent(), oldEntries, staged);
    const jsonByPath = new Map(plan.json.map((f) => [f.path, f.buf.toString('utf8')]));
    const imagePaths = plan.images.map((f) => f.path).sort();

    expect(jsonByPath.has('data/site.json')).toBe(true);
    expect(jsonByPath.has('data/pictures.json')).toBe(true);
    expect(JSON.parse(jsonByPath.get('data/pictures.json') as string)).toEqual(['demo-gallery']);

    const meta = JSON.parse(jsonByPath.get('data/pictures/demo-gallery/meta.json') as string);
    expect(meta.id).toBe('demo-gallery');
    expect(meta.thumbnail).toBe('demo-02');
    expect(meta.imageOrder).toEqual(['demo-01', 'demo-02', T1]);

    expect(imagePaths).toEqual(
      ['data/pictures/demo-gallery/' + T1 + '.webp', 'data/uploads/' + T2 + '.webp'].sort(),
    );

    expect(plan.content.site.logo).toBe(`/media/uploads/${T2}.webp`);
    expect(plan.content.pictures[0]!.images).toEqual([
      '/media/pictures/demo-gallery/demo-01.webp',
      '/media/pictures/demo-gallery/demo-02.webp',
      `/media/pictures/demo-gallery/${T1}.webp`,
    ]);
    expect(plan.content.pictures[0]!.thumbnail).toBe('/media/pictures/demo-gallery/demo-02.webp');
  });

  it('chooses the first image when no thumbnail was selected', () => {
    const content = galleryContent();
    content.pictures[0].thumbnail = '';
    const plan = planCommit(content, oldEntries, staged);
    expect(plan.content.pictures[0].thumbnail).toBe(plan.content.pictures[0].images[0]);
    const meta = plan.json.find(f => f.path.endsWith('/meta.json'))!;
    expect(JSON.parse(meta.buf.toString()).thumbnail).toBe('demo-01');
  });

  it('deletes removed groups and unreferenced uploads but preserves kept sources and unknown files', () => {
    const plan = planCommit(galleryContent(), oldEntries, staged);
    const deletions = new Set(plan.deletions);

    // Removed group and unreferenced upload are deleted.
    expect(deletions.has('data/pictures/old-group/x.png')).toBe(true);
    expect(deletions.has('data/pictures/old-group/meta.json')).toBe(true);
    expect(deletions.has('data/uploads/keepme.webp')).toBe(true);

    // Kept gallery sources (original .png extension) are preserved.
    expect(deletions.has('data/pictures/demo-gallery/demo-01.png')).toBe(false);
    expect(deletions.has('data/pictures/demo-gallery/demo-02.png')).toBe(false);
    expect(deletions.has('data/pictures/demo-gallery/meta.json')).toBe(false);

    // Files outside managed media scope are never touched.
    expect(deletions.has('data/README.md')).toBe(false);
    expect(deletions.has('docs/notes.txt')).toBe(false);
  });

  it('rejects gallery images with no existing source or from outside the group', () => {
    const missing = makeContent();
    missing.pictures = [
      { id: 'g1', name: 'g', date: '', description: '', thumbnail: '', images: ['/media/pictures/g1/ghost.webp'] },
    ];
    expect(() => planCommit(missing, [], new Map())).toThrow(GitHubError);

    const external = makeContent();
    external.pictures = [
      { id: 'g1', name: 'g', date: '', description: '', thumbnail: '', images: ['https://evil.example/a.webp'] },
    ];
    expect(() => planCommit(external, [], new Map())).toThrow(GitHubError);
  });

  it('rejects a staged token that has no buffer', () => {
    const content = makeContent();
    content.pictures = [
      { id: 'g1', name: 'g', date: '', description: '', thumbnail: '', images: [STAGED_1] },
    ];
    expect(() => planCommit(content, [], new Map())).toThrow(GitHubError);
  });
});

// ---------------------------------------------------------------------------
// commitContent (GitHub API interaction via injected fetch)
// ---------------------------------------------------------------------------

const cfg: GithubConfig = {
  token: 'secret-pat-value',
  owner: 'o',
  repo: 'r',
  branch: 'main',
  apiBase: 'https://api.github.com',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function makeServer(overrides: { head?: string; patchStatus?: number } = {}) {
  const state = {
    head: overrides.head ?? 'base-sha',
    tree: 'tree-sha',
    entries: [] as TreeEntry[],
    blobs: 0,
    treeCalls: 0,
    commitCalls: 0,
    patch: null as { sha: string; force: boolean } | null,
    methods: [] as string[],
  };
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    state.methods.push(method);
    if (url.includes('/git/ref/heads/') && method === 'GET') return json({ object: { sha: state.head } });
    if (url.includes('/git/commits/') && method === 'GET') return json({ sha: state.head, tree: { sha: state.tree } });
    if (url.includes('/git/trees/') && method === 'GET') return json({ sha: state.tree, tree: state.entries });
    if (url.endsWith('/git/blobs') && method === 'POST') {
      state.blobs += 1;
      return json({ sha: `blob-${state.blobs}` });
    }
    if (url.endsWith('/git/trees') && method === 'POST') {
      state.treeCalls += 1;
      return json({ sha: 'new-tree' });
    }
    if (url.endsWith('/git/commits') && method === 'POST') {
      state.commitCalls += 1;
      return json({ sha: 'new-commit' });
    }
    if (url.includes('/git/refs/heads/') && method === 'PATCH') {
      if (overrides.patchStatus && overrides.patchStatus >= 400) {
        return json({ message: 'Update is not a fast forward' }, overrides.patchStatus);
      }
      state.patch = JSON.parse(String(init?.body));
      return json({ object: { sha: 'new-commit' } });
    }
    return new Response('not found', { status: 404 });
  }) as typeof fetch;
  return { state, fetchImpl };
}

describe('commitContent', () => {
  function changedContent(): Content {
    const content = makeContent();
    content.site.name = 'Changed Name';
    return content;
  }

  it('creates one atomic non-force commit', async () => {
    const { state, fetchImpl } = makeServer();
    const result = await commitContent(cfg, changedContent(), { baseSha: 'base-sha', fetchImpl });

    expect(result.sha).toBe('new-commit');
    expect(result.content).toBeDefined();
    expect(result.url).toContain('/commit/new-commit');
    expect(state.commitCalls).toBe(1);
    expect(state.treeCalls).toBe(1);
    expect(state.patch).toEqual({ sha: 'new-commit', force: false });
  });

  it('rejects a stale base revision without writing', async () => {
    const { state, fetchImpl } = makeServer({ head: 'moved-sha' });
    await expect(
      commitContent(cfg, changedContent(), { baseSha: 'base-sha', fetchImpl }),
    ).rejects.toBeInstanceOf(GitHubConflictError);
    expect(state.methods.every((m) => m === 'GET')).toBe(true);
  });

  it('maps a non-fast-forward ref update to a 409 conflict', async () => {
    const { fetchImpl } = makeServer({ patchStatus: 422 });
    await expect(
      commitContent(cfg, changedContent(), { baseSha: 'base-sha', fetchImpl }),
    ).rejects.toBeInstanceOf(GitHubConflictError);
  });

  it('returns the current head when there is nothing to change', async () => {
    const { state, fetchImpl } = makeServer();
    // Prime the tree with the exact JSON the planner will produce.
    const content = makeContent();
    const plan = planCommit(content, [], new Map());
    state.entries = plan.json.map((f) => ({ path: f.path, sha: gitBlobSha(f.buf), mode: '100644', type: 'blob' }));

    const result = await commitContent(cfg, content, { baseSha: 'base-sha', fetchImpl });
    expect(result.sha).toBe('base-sha');
    expect(state.commitCalls).toBe(0);
  });
});

describe('admin-managed home content', () => {
  const T3 = 'c'.repeat(32);
  const T4 = 'd'.repeat(32);
  const T5 = 'e'.repeat(32);

  it('publishes uploaded publication photos and equipment-partner images', () => {
    const content = makeContent();
    content.site.grantAmount = 15_000_000;
    content.site.partners = [
      { name: 'Acme', logo: `/api/admin/uploads/${T3}`, product: `/api/admin/uploads/${T4}`, productName: '', description: '', link: '' },
    ];
    content.publications = [
      { id: 'p1', title: 't', authors: 'a', year: 2025, venue: 'v', tags: [], link: '', image: `/api/admin/uploads/${T5}` },
    ];

    const tokens = collectStagedTokens(content);
    expect([T3, T4, T5].every((t) => tokens.has(t))).toBe(true);

    const staged = new Map<string, Buffer>([
      [T3, Buffer.from('3')],
      [T4, Buffer.from('4')],
      [T5, Buffer.from('5')],
    ]);
    const plan = planCommit(content, [], staged);
    const site = JSON.parse(plan.json.find((f) => f.path === 'data/site.json')!.buf.toString('utf8'));
    const pubs = JSON.parse(plan.json.find((f) => f.path === 'data/publications.json')!.buf.toString('utf8'));

    expect(site.grantAmount).toBe(15_000_000);
    expect(site.partners[0].logo).toBe(`/media/uploads/${T3}.webp`);
    expect(site.partners[0].product).toBe(`/media/uploads/${T4}.webp`);
    expect(pubs[0].image).toBe(`/media/uploads/${T5}.webp`);
    expect(JSON.stringify(plan.json)).not.toContain('/api/admin/uploads/');
  });

  it('publishes uploaded per-year publication photos', () => {
    const T6 = 'f'.repeat(32);
    const content = makeContent();
    content.site.publicationYearImages = { '2025': `/api/admin/uploads/${T6}` };
    expect(collectStagedTokens(content).has(T6)).toBe(true);
    const plan = planCommit(content, [], new Map([[T6, Buffer.from('6')]]));
    const site = JSON.parse(plan.json.find((f) => f.path === 'data/site.json')!.buf.toString('utf8'));
    expect(site.publicationYearImages['2025']).toBe(`/media/uploads/${T6}.webp`);
  });
});
