import { createHash } from 'node:crypto';
import type { Content, PictureGroup, Site } from './types';

/**
 * GitHub Git Database API client + pure commit-planning helpers.
 *
 * Everything here runs server-side only. The fine-grained GITHUB_PAT is read
 * from the environment and is never echoed in error messages, returned bodies or
 * logs. Optimistic concurrency is enforced by comparing the caller's `baseSha`
 * with the current branch head and by performing a non-force ref update, which
 * the API rejects (mapped to 409) when the branch has moved.
 *
 * The planner mirrors the read semantics of `lib/content.ts` (which is owned by
 * a different work stream and intentionally not imported here):
 *   - group order comes from `data/pictures.json`
 *   - per group `meta.json` holds name/date/description/thumbnail/imageOrder
 *   - images live as source rasters under `data/pictures/<id>/` and are served
 *     as `/media/pictures/<id>/<stem>.webp`
 *   - plain uploads are stored at `data/uploads/<token>.webp` and served as
 *     `/media/uploads/<token>.webp`
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type GithubConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  apiBase: string;
};

export const DEFAULT_API_BASE = 'https://api.github.com';

export type TreeEntry = {
  path: string;
  mode: string;
  type: 'blob' | 'tree' | 'commit';
  sha: string;
  size?: number;
};

export type PlannedFile = { path: string; buf: Buffer };

export type CommitPlan = {
  /** Serialised JSON documents (collections, pictures index, group meta). */
  json: PlannedFile[];
  /** Image blobs to write. */
  images: PlannedFile[];
  /** Managed media paths that must be removed from the tree. */
  deletions: string[];
  /** Content with staged upload URLs rewritten to their final media URLs. */
  content: Content;
};

export type CommitResult = { sha: string; url: string; message: string; content: Content };

export class GitHubError extends Error {
  readonly status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = 'GitHubError';
    this.status = status;
  }
}

export class GitHubConflictError extends GitHubError {
  constructor(message = 'GitHub branch moved; refresh and retry') {
    super(message, 409);
    this.name = 'GitHubConflictError';
  }
}

export type FetchLike = typeof fetch;

// ---------------------------------------------------------------------------
// Config + small pure helpers
// ---------------------------------------------------------------------------

export function githubConfigFromEnv(env: NodeJS.ProcessEnv = process.env): GithubConfig {
  return {
    token: env.GITHUB_PAT ?? '',
    owner: env.GITHUB_OWNER ?? 'zapds',
    repo: env.GITHUB_REPO ?? 'brainx-lab',
    branch: env.GITHUB_BRANCH ?? 'main',
    apiBase: env.GITHUB_API_BASE ?? DEFAULT_API_BASE,
  };
}

export function isGithubConfigured(cfg: GithubConfig): boolean {
  return cfg.token.length > 0 && cfg.owner.length > 0 && cfg.repo.length > 0;
}

export function repoHtmlUrl(cfg: GithubConfig): string {
  return `https://github.com/${cfg.owner}/${cfg.repo}`;
}

/** Git blob object id: sha1("blob <len>\0" + content). Lets us skip unchanged writes. */
export function gitBlobSha(buf: Buffer): string {
  const header = Buffer.from(`blob ${buf.length}\0`, 'utf8');
  return createHash('sha1').update(header).update(buf).digest('hex');
}

export function dataPathFromMediaUrl(url: string): string | null {
  if (!url.startsWith('/media/')) return null;
  return `data/${url.slice('/media/'.length)}`;
}

export function mediaUrlFromDataPath(dataPath: string): string | null {
  if (!dataPath.startsWith('data/')) return null;
  return `/media/${dataPath.slice('data/'.length)}`;
}

const STAGED_RE = /^\/api\/admin\/uploads\/([a-f0-9]{32})$/;

/** Returns the upload token if `url` is a locally staged upload, else null. */
export function stagedTokenFromUrl(url: string): string | null {
  const match = STAGED_RE.exec(url);
  return match ? match[1] : null;
}

/** Every staged upload token referenced anywhere in `content`. */
export function collectStagedTokens(content: Content): Set<string> {
  const tokens = new Set<string>();
  const add = (value: string) => {
    const token = stagedTokenFromUrl(value);
    if (token) tokens.add(token);
  };
  add(content.site.logo);
  for (const partner of content.site.partners ?? []) {
    add(partner.logo);
    add(partner.product);
  }
  for (const publication of content.publications) if (publication.image) add(publication.image);
  for (const member of content.team) add(member.image);
  for (const item of content.research) if (item.image) add(item.image);
  for (const project of content.projects) {
    add(project.image);
    if (project.images) {
      for (const img of project.images) add(img);
    }
  }
  for (const event of content.events) add(event.image);
  for (const group of content.pictures) {
    add(group.thumbnail);
    for (const image of group.images) add(image);
  }
  return tokens;
}

export function treeMap(entries: TreeEntry[]): Map<string, TreeEntry> {
  const map = new Map<string, TreeEntry>();
  for (const entry of entries) map.set(entry.path, entry);
  return map;
}

// ---------------------------------------------------------------------------
// Serialisation helpers
// ---------------------------------------------------------------------------

export function serializeJson(value: unknown): Buffer {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

const RASTER_RE = /\.(png|jpe?g|webp|avif|gif|tiff?|bmp)$/i;

export function toStem(file: string): string {
  return RASTER_RE.test(file) ? file.replace(RASTER_RE, '') : file;
}

function isRaster(file: string): boolean {
  return RASTER_RE.test(file);
}

function basename(p: string): string {
  const index = p.lastIndexOf('/');
  return index === -1 ? p : p.slice(index + 1);
}

function dirname(p: string): string {
  const index = p.lastIndexOf('/');
  return index === -1 ? '' : p.slice(0, index);
}

// ---------------------------------------------------------------------------
// Pure commit planner
// ---------------------------------------------------------------------------

const PICTURES_PREFIX = 'data/pictures/';
const UPLOADS_PREFIX = 'data/uploads/';

type PictureMetaOut = {
  id: string;
  name: string;
  date: string;
  description: string;
  thumbnail: string;
  imageOrder: string[];
  tags?: string[];
};

/**
 * Build the complete set of writes and deletions required to make the remote
 * tree match `content`. Pure: callers provide the current tree entries and the
 * staged upload buffers, keyed by token.
 *
 * Unknown remote files outside `data/pictures/**` and `data/uploads/**` are
 * preserved; only managed media that the new content no longer references is
 * deleted.
 */
export function planCommit(
  content: Content,
  oldEntries: TreeEntry[],
  staged: Map<string, Buffer>,
): CommitPlan {
  const working = structuredClone(content) as Content;
  const json: PlannedFile[] = [];
  const images: PlannedFile[] = [];
  const desired = new Set<string>();
  const written = new Set<string>();

  const queueImage = (path: string, buf: Buffer) => {
    if (!written.has(path)) {
      images.push({ path, buf });
      written.add(path);
    }
    desired.add(path);
  };

  const requireStaged = (token: string, context: string): Buffer => {
    const buf = staged.get(token);
    if (!buf) throw new GitHubError(`missing staged upload for ${context}`, 400);
    return buf;
  };

  // Index existing gallery sources by group + stem so we keep original
  // extensions (e.g. demo-01.png) instead of inventing .webp paths.
  const groupSourceByStem = new Map<string, Map<string, string>>();
  for (const entry of oldEntries) {
    if (entry.type !== 'blob' || !entry.path.startsWith(PICTURES_PREFIX)) continue;
    const rel = entry.path.slice(PICTURES_PREFIX.length);
    const groupId = dirname(rel);
    const file = basename(rel);
    if (!groupId || !isRaster(file)) continue;
    let stems = groupSourceByStem.get(groupId);
    if (!stems) {
      stems = new Map();
      groupSourceByStem.set(groupId, stems);
    }
    const stem = toStem(file);
    if (!stems.has(stem)) stems.set(stem, entry.path);
  }

  // --- pictures -----------------------------------------------------------
  const groupOrder: string[] = [];
  for (const group of working.pictures) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(group.id)) {
      throw new GitHubError('unsafe picture group id', 400);
    }
    groupOrder.push(group.id);
    const groupDir = `${PICTURES_PREFIX}${group.id}`;
    const sourceByStem = groupSourceByStem.get(group.id) ?? new Map<string, string>();
    const metaPath = `${groupDir}/meta.json`;

    const finalImages: string[] = [];
    const finalStems: string[] = [];
    const seenUrls = new Set<string>();

    const resolveImage = (url: string): string | null => {
      if (url === '') return null;
      const token = stagedTokenFromUrl(url);
      if (token) {
        requireStaged(token, `picture ${group.id}`);
        const targetStem = token;
        queueImage(`${groupDir}/${targetStem}.webp`, staged.get(token) as Buffer);
        return `/media/pictures/${group.id}/${targetStem}.webp`;
      }
      const mediaPath = dataPathFromMediaUrl(url);
      if (mediaPath && mediaPath.startsWith(`${groupDir}/`)) {
        const stem = toStem(basename(mediaPath));
        const existing = sourceByStem.get(stem);
        // Own-group reference with no matching source would silently vanish at
        // compile time; reject rather than write a dangling entry.
        if (!existing) throw new GitHubError(`gallery image source missing for group ${group.id}`, 400);
        desired.add(existing);
        return `/media/pictures/${group.id}/${stem}.webp`;
      }
      // Gallery images are directory rasters only: staged tokens or own-group
      // media. Anything else would silently vanish at compile time.
      throw new GitHubError(`invalid gallery image for group ${group.id}`, 400);
    };

    for (const image of group.images) {
      const resolved = resolveImage(image);
      if (resolved && !seenUrls.has(resolved)) {
        seenUrls.add(resolved);
        finalImages.push(resolved);
        finalStems.push(toStem(basename(resolved)));
      }
    }

    let thumbUrl = resolveImage(group.thumbnail);
    if (thumbUrl && !seenUrls.has(thumbUrl)) {
      seenUrls.add(thumbUrl);
      finalImages.push(thumbUrl);
      finalStems.push(toStem(basename(thumbUrl)));
    }
    if (!thumbUrl) thumbUrl = finalImages[0] ?? '';

    group.images = finalImages;
    group.thumbnail = thumbUrl;

    const isLocalThumb = thumbUrl.startsWith(`/media/pictures/${group.id}/`);
    const meta: PictureMetaOut = {
      id: group.id,
      name: group.name,
      date: group.date,
      description: group.description,
      thumbnail: isLocalThumb ? toStem(basename(thumbUrl)) : '',
      imageOrder: finalStems,
      ...(Array.isArray(group.tags) && group.tags.length > 0 ? { tags: group.tags } : {}),
    };
    json.push({ path: metaPath, buf: serializeJson(meta) });
    desired.add(metaPath);
  }

  // --- plain image fields -------------------------------------------------
  const resolvePlain = (url: string, context: string): string => {
    if (url === '') return '';
    const token = stagedTokenFromUrl(url);
    if (token) {
      requireStaged(token, context);
      queueImage(`${UPLOADS_PREFIX}${token}.webp`, staged.get(token) as Buffer);
      return `/media/uploads/${token}.webp`;
    }
    const dataPath = dataPathFromMediaUrl(url);
    if (dataPath) desired.add(dataPath);
    return url;
  };

  working.site.logo = resolvePlain(working.site.logo, 'site logo');
  for (const [i, partner] of (working.site.partners ?? []).entries()) {
    partner.logo = resolvePlain(partner.logo, `partner ${i + 1} logo`);
    partner.product = resolvePlain(partner.product, `partner ${i + 1} product`);
  }
  for (const publication of working.publications) {
    if (publication.image) publication.image = resolvePlain(publication.image, `publication ${publication.id}`);
  }
  for (const member of working.team) member.image = resolvePlain(member.image, `member ${member.id}`);
  for (const item of working.research) {
    if (item.image) item.image = resolvePlain(item.image, `research ${item.id}`);
  }
  for (const project of working.projects) {
    project.image = resolvePlain(project.image, `project ${project.id}`);
    if (project.images) {
      project.images = project.images
        .map((img: string, idx: number) => resolvePlain(img, `project ${project.id} image ${idx}`))
        .filter(Boolean);
    }
    if (!project.image && project.images && project.images.length > 0) {
      project.image = project.images[0];
    }
  }
  for (const event of working.events) event.image = resolvePlain(event.image, `event ${event.id}`);

  // --- collection JSON ----------------------------------------------------
  json.push({ path: 'data/site.json', buf: serializeJson(working.site) });
  json.push({ path: 'data/publications.json', buf: serializeJson(working.publications) });
  json.push({ path: 'data/team.json', buf: serializeJson(working.team) });
  json.push({ path: 'data/research.json', buf: serializeJson(working.research) });
  json.push({ path: 'data/projects.json', buf: serializeJson(working.projects) });
  json.push({ path: 'data/news.json', buf: serializeJson(working.news) });
  json.push({ path: 'data/events.json', buf: serializeJson(working.events) });
  json.push({ path: 'data/pictures.json', buf: serializeJson(groupOrder) });

  for (const file of json) desired.add(file.path);

  // --- deletions ----------------------------------------------------------
  const deletions = oldEntries
    .filter(
      (entry) =>
        entry.type === 'blob' &&
        (entry.path.startsWith(PICTURES_PREFIX) || entry.path.startsWith(UPLOADS_PREFIX)),
    )
    .map((entry) => entry.path)
    .filter((path) => !desired.has(path));

  return { json, images, deletions, content: working };
}

// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------

async function ghFetch(
  cfg: GithubConfig,
  pathname: string,
  init: RequestInit,
  fetchImpl: FetchLike,
): Promise<unknown> {
  const url = pathname.startsWith('http') ? pathname : `${cfg.apiBase}${pathname}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${cfg.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'brainx-lab-cms',
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
  };

  let response: Response;
  try {
    response = await fetchImpl(url, { ...init, headers: { ...headers, ...(init.headers as object) } });
  } catch {
    // Network failure: never surface the underlying error (may contain the URL).
    throw new GitHubError('GitHub request failed');
  }

  if (!response.ok) {
    let detail = '';
    try {
      const body = (await response.json()) as { message?: unknown };
      if (typeof body.message === 'string') detail = `: ${body.message}`;
    } catch {
      /* ignore non-JSON error bodies */
    }
    const status = response.status;
    const message = `GitHub ${pathname} failed (${status})${detail}`;
    if (status === 409 || status === 422) throw new GitHubConflictError(message);
    throw new GitHubError(message, status);
  }

  if (response.status === 204) return null;
  return response.json();
}

type RefResponse = { object: { sha: string } };
type CommitResponse = { sha: string; tree: { sha: string } };
type TreeResponse = { sha: string; tree: TreeEntry[]; truncated?: boolean };
type BlobResponse = { content: string; encoding: string };
type CreatedRef = { object: { sha: string } };

export function encodeRefBranch(branch: string): string {
  return branch
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
}

export async function getBranchHead(
  cfg: GithubConfig,
  fetchImpl: FetchLike = fetch,
): Promise<string> {
  const ref = (await ghFetch(
    cfg,
    `/repos/${cfg.owner}/${cfg.repo}/git/ref/heads/${encodeRefBranch(cfg.branch)}`,
    { method: 'GET' },
    fetchImpl,
  )) as RefResponse;
  return ref.object.sha;
}

export async function getCommitTree(
  cfg: GithubConfig,
  commitSha: string,
  fetchImpl: FetchLike = fetch,
): Promise<string> {
  const commit = (await ghFetch(
    cfg,
    `/repos/${cfg.owner}/${cfg.repo}/git/commits/${commitSha}`,
    { method: 'GET' },
    fetchImpl,
  )) as CommitResponse;
  return commit.tree.sha;
}

export async function getTree(
  cfg: GithubConfig,
  treeSha: string,
  fetchImpl: FetchLike = fetch,
): Promise<TreeEntry[]> {
  const tree = (await ghFetch(
    cfg,
    `/repos/${cfg.owner}/${cfg.repo}/git/trees/${treeSha}?recursive=1`,
    { method: 'GET' },
    fetchImpl,
  )) as TreeResponse;
  if (tree.truncated) {
    throw new GitHubError('Repository file listing is incomplete; refusing to publish partial content', 502);
  }
  return tree.tree;
}

export async function getBlob(
  cfg: GithubConfig,
  blobSha: string,
  fetchImpl: FetchLike = fetch,
): Promise<Buffer> {
  const blob = (await ghFetch(
    cfg,
    `/repos/${cfg.owner}/${cfg.repo}/git/blobs/${blobSha}`,
    { method: 'GET' },
    fetchImpl,
  )) as BlobResponse;
  return Buffer.from(blob.content, blob.encoding === 'base64' ? 'base64' : 'utf8');
}

export async function createBlob(
  cfg: GithubConfig,
  buf: Buffer,
  fetchImpl: FetchLike = fetch,
): Promise<string> {
  const blob = (await ghFetch(
    cfg,
    `/repos/${cfg.owner}/${cfg.repo}/git/blobs`,
    { method: 'POST', body: JSON.stringify({ content: buf.toString('base64'), encoding: 'base64' }) },
    fetchImpl,
  )) as { sha: string };
  return blob.sha;
}

export async function createTree(
  cfg: GithubConfig,
  baseTree: string,
  entries: Array<{ path: string; mode: string; type: string; sha: string | null }>,
  fetchImpl: FetchLike = fetch,
): Promise<string> {
  const tree = (await ghFetch(
    cfg,
    `/repos/${cfg.owner}/${cfg.repo}/git/trees`,
    { method: 'POST', body: JSON.stringify({ base_tree: baseTree, tree: entries }) },
    fetchImpl,
  )) as { sha: string };
  return tree.sha;
}

export async function createCommit(
  cfg: GithubConfig,
  params: { message: string; tree: string; parents: string[] },
  fetchImpl: FetchLike = fetch,
): Promise<string> {
  const commit = (await ghFetch(
    cfg,
    `/repos/${cfg.owner}/${cfg.repo}/git/commits`,
    { method: 'POST', body: JSON.stringify(params) },
    fetchImpl,
  )) as CommitResponse;
  return commit.sha;
}

export async function updateRef(
  cfg: GithubConfig,
  commitSha: string,
  fetchImpl: FetchLike = fetch,
): Promise<void> {
  await ghFetch(
    cfg,
    `/repos/${cfg.owner}/${cfg.repo}/git/refs/heads/${encodeRefBranch(cfg.branch)}`,
    { method: 'PATCH', body: JSON.stringify({ sha: commitSha, force: false }) },
    fetchImpl,
  ) as CreatedRef;
}

// ---------------------------------------------------------------------------
// Remote read (mirrors lib/content.ts semantics)
// ---------------------------------------------------------------------------

export const FALLBACK_SITE: Site = {
  name: 'BrainX Lab',
  institution: 'IIITDM Kancheepuram',
  tagline: '',
  about: '',
  focus: '',
  email: '',
  phone: '',
  address: 'IIITDM Kancheepuram',
  logo: '',
};

function parseJsonBlob<T>(buf: Buffer | null, fallback: T): T {
  if (!buf) return fallback;
  try {
    return JSON.parse(buf.toString('utf8')) as T;
  } catch {
    return fallback;
  }
}

function orderStems(stems: string[], imageOrder?: string[]): string[] {
  const available = new Set(stems);
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const raw of imageOrder ?? []) {
    const stem = toStem(raw);
    if (available.has(stem) && !seen.has(stem)) {
      ordered.push(stem);
      seen.add(stem);
    }
  }
  for (const stem of [...stems].sort()) {
    if (!seen.has(stem)) {
      ordered.push(stem);
      seen.add(stem);
    }
  }
  return ordered;
}

type PictureMetaIn = {
  name?: string;
  date?: string;
  description?: string;
  thumbnail?: string;
  imageOrder?: string[];
  tags?: string[];
};

function scanGroups(entries: TreeEntry[], id: string, meta: PictureMetaIn): PictureGroup {
  const dir = `${PICTURES_PREFIX}${id}/`;
  const stems = entries
    .filter((entry) => entry.type === 'blob' && entry.path.startsWith(dir))
    .map((entry) => basename(entry.path))
    .filter(isRaster)
    .map(toStem);

  const ordered = orderStems(stems, meta.imageOrder);
  const requested = meta.thumbnail ? toStem(meta.thumbnail) : '';
  const thumbnailStem = requested && stems.includes(requested) ? requested : ordered[0] ?? '';
  const url = (stem: string) => `/media/pictures/${id}/${stem}.webp`;

  return {
    id,
    name: meta.name ?? id,
    date: meta.date ?? '',
    description: meta.description ?? '',
    thumbnail: thumbnailStem ? url(thumbnailStem) : '',
    images: ordered.map(url),
    ...(Array.isArray(meta.tags) && meta.tags.length > 0 ? { tags: meta.tags } : {}),
  };
}

export type RemoteContent = { content: Content; sha: string; treeSha: string };

/** Read the full Content tree from the remote branch head. */
export async function readRemoteContent(
  cfg: GithubConfig,
  fetchImpl: FetchLike = fetch,
): Promise<RemoteContent> {
  const sha = await getBranchHead(cfg, fetchImpl);
  const treeSha = await getCommitTree(cfg, sha, fetchImpl);
  const entries = await getTree(cfg, treeSha, fetchImpl);
  const map = treeMap(entries);

  const readFile = async (path: string): Promise<Buffer | null> => {
    const entry = map.get(path);
    if (!entry) return null;
    return getBlob(cfg, entry.sha, fetchImpl);
  };

  const [site, publications, team, research, projects, news, events] = await Promise.all([
    readFile('data/site.json'),
    readFile('data/publications.json'),
    readFile('data/team.json'),
    readFile('data/research.json'),
    readFile('data/projects.json'),
    readFile('data/news.json'),
    readFile('data/events.json'),
  ]);

  const declaredOrder = parseJsonBlob<string[]>(await readFile('data/pictures.json'), []);
  const onDisk = entries
    .filter((entry) => entry.type === 'tree' && entry.path.startsWith(PICTURES_PREFIX))
    .map((entry) => entry.path.slice(PICTURES_PREFIX.length))
    .filter((id) => id.length > 0 && !id.includes('/'));

  const ids: string[] = [];
  for (const id of declaredOrder) if (onDisk.includes(id) && !ids.includes(id)) ids.push(id);
  for (const id of [...onDisk].sort()) if (!ids.includes(id)) ids.push(id);

  const pictures: PictureGroup[] = [];
  for (const id of ids) {
    const meta = parseJsonBlob<PictureMetaIn>(await readFile(`${PICTURES_PREFIX}${id}/meta.json`), {});
    pictures.push(scanGroups(entries, id, meta));
  }

  return {
    sha,
    treeSha,
    content: {
      site: parseJsonBlob<Site>(site, FALLBACK_SITE),
      publications: parseJsonBlob(publications, []),
      team: parseJsonBlob(team, []),
      research: parseJsonBlob(research, []),
      projects: parseJsonBlob(projects, []),
      news: parseJsonBlob(news, []),
      events: parseJsonBlob(events, []),
      pictures,
    },
  };
}

// ---------------------------------------------------------------------------
// Atomic commit
// ---------------------------------------------------------------------------

export const DEFAULT_COMMIT_MESSAGE = 'chore(content): update site content via admin';

export type CommitOptions = {
  baseSha: string;
  message?: string;
  staged?: Map<string, Buffer>;
  fetchImpl?: FetchLike;
};

/**
 * Create ONE atomic commit that makes the remote tree match `content`.
 *
 * `baseSha` must equal the current branch head or a 409 conflict is thrown
 * before any write. A second race check is the non-force ref update at the end.
 */
export async function commitContent(
  cfg: GithubConfig,
  content: Content,
  options: CommitOptions,
): Promise<CommitResult> {
  const { baseSha } = options;
  const fetchImpl = options.fetchImpl ?? fetch;
  const staged = options.staged ?? new Map<string, Buffer>();
  const message = options.message ?? DEFAULT_COMMIT_MESSAGE;

  const head = await getBranchHead(cfg, fetchImpl);
  if (head !== baseSha) throw new GitHubConflictError();

  const baseTree = await getCommitTree(cfg, head, fetchImpl);
  const oldEntries = await getTree(cfg, baseTree, fetchImpl);
  const existing = treeMap(oldEntries);

  const plan = planCommit(content, oldEntries, staged);

  const files = [...plan.json, ...plan.images];
  const newEntries: Array<{ path: string; mode: string; type: string; sha: string | null }> = [];
  let changed = false;

  // Unchanged files are omitted so the base tree keeps them as-is.
  for (const file of files) {
    const localSha = gitBlobSha(file.buf);
    const current = existing.get(file.path);
    if (current && current.sha === localSha) continue;
    const blobSha = await createBlob(cfg, file.buf, fetchImpl);
    newEntries.push({ path: file.path, mode: '100644', type: 'blob', sha: blobSha });
    changed = true;
  }

  for (const path of plan.deletions) {
    newEntries.push({ path, mode: '100644', type: 'blob', sha: null });
    changed = true;
  }

  if (!changed) {
    return { sha: head, url: `${repoHtmlUrl(cfg)}/commit/${head}`, message, content: plan.content };
  }

  const treeSha = await createTree(cfg, baseTree, newEntries, fetchImpl);
  const commitSha = await createCommit(cfg, { message, tree: treeSha, parents: [head] }, fetchImpl);
  await updateRef(cfg, commitSha, fetchImpl);

  return { sha: commitSha, url: `${repoHtmlUrl(cfg)}/commit/${commitSha}`, message, content: plan.content };
}

export const CONTENT_PATHS = [
  'data/site.json',
  'data/publications.json',
  'data/team.json',
  'data/research.json',
  'data/projects.json',
  'data/news.json',
  'data/events.json',
  'data/pictures.json',
] as const;
