import fs from 'node:fs';
import path from 'node:path';
import type {
  Content,
  Event,
  Member,
  News,
  PictureGroup,
  Project,
  Publication,
  Research,
  Site,
} from './types';

/**
 * Compile-time content source.
 *
 * All public content is read from the `data/` directory at build time (native
 * filesystem, no database). Picture groups are assembled by scanning
 * `data/pictures/<id>/` for a `meta.json` and every raster image it contains.
 * The group order comes from the `data/pictures.json` array of group ids.
 *
 * Image URLs are emitted as `/media/pictures/<id>/<file>.webp`; the mapping from
 * the source rasters in `data/` to the served files in `public/media/` is done by
 * `scripts/prepare-media.mjs` at prebuild time.
 */

const DATA_DIR = path.join(process.cwd(), 'data');
const PICTURES_DIR = path.join(DATA_DIR, 'pictures');

/** Raster extensions that count as gallery images. */
const RASTER_RE = /\.(png|jpe?g|webp|avif|gif|tiff?|bmp)$/i;

const FALLBACK_SITE: Site = {
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

type PictureMeta = {
  name?: string;
  date?: string;
  description?: string;
  /** Either a bare stem ("photo-01") or a filename ("photo-01.png"). */
  thumbnail?: string;
  /** Optional explicit ordering by bare stem or filename; unknown entries are ignored. */
  imageOrder?: string[];
  /** Optional category/tag pills for the event album card. */
  tags?: string[];
};

function readJson<T>(relativePath: string, fallback: T): T {
  const file = path.join(DATA_DIR, relativePath);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function isRaster(file: string): boolean {
  return RASTER_RE.test(file);
}

/** Strip the raster extension from a filename or passthrough a bare stem. */
function toStem(file: string): string {
  return isRaster(file) ? file.replace(RASTER_RE, '') : file;
}

/**
 * Resolve the final image order for a group. `imageOrder` (if present) wins for
 * the stems it names; remaining stems follow in ascending filename order.
 */
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

function mediaUrl(groupId: string, stem: string): string {
  return `/media/pictures/${groupId}/${stem}.webp`;
}

function scanPictureGroup(id: string, meta: PictureMeta): PictureGroup {
  const dir = path.join(PICTURES_DIR, id);
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir).filter((file) => isRaster(file));
  } catch {
    files = [];
  }

  const stems = files.map(toStem);
  const ordered = orderStems(stems, meta.imageOrder);

  const requestedThumb = meta.thumbnail ? toStem(meta.thumbnail) : '';
  const thumbnailStem = requestedThumb && stems.includes(requestedThumb) ? requestedThumb : ordered[0] ?? '';

  return {
    id,
    name: meta.name ?? id,
    date: meta.date ?? '',
    description: meta.description ?? '',
    thumbnail: thumbnailStem ? mediaUrl(id, thumbnailStem) : '',
    images: ordered.map((stem) => mediaUrl(id, stem)),
    ...(Array.isArray(meta.tags) && meta.tags.length > 0 ? { tags: meta.tags } : {}),
  };
}

function scanPictures(): PictureGroup[] {
  if (!fs.existsSync(PICTURES_DIR)) return [];

  const declaredOrder = readJson<string[]>('pictures.json', []);
  const onDisk = fs
    .readdirSync(PICTURES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const ids: string[] = [];
  // Declared order first (only ids that actually exist)...
  for (const id of declaredOrder) {
    if (onDisk.includes(id) && !ids.includes(id)) ids.push(id);
  }
  // ...then any remaining on-disk groups, alphabetically.
  for (const id of [...onDisk].sort()) {
    if (!ids.includes(id)) ids.push(id);
  }

  return ids.map((id) => scanPictureGroup(id, readJson<PictureMeta>(`pictures/${id}/meta.json`, {})));
}

/** Read and compile the full public content tree from `data/`. */
export function getContent(): Content {
  return {
    site: readJson<Site>('site.json', FALLBACK_SITE),
    publications: readJson<Publication[]>('publications.json', []),
    team: readJson<Member[]>('team.json', []),
    research: readJson<Research[]>('research.json', []),
    projects: readJson<Project[]>('projects.json', []),
    news: readJson<News[]>('news.json', []),
    events: readJson<Event[]>('events.json', []),
    pictures: scanPictures(),
  };
}

/* ------------------------------------------------------------------ */
/* Presentation helpers (pure; safe to use from server components)     */
/* ------------------------------------------------------------------ */

export type PublicationYearGroup = { year: number; items: Publication[] };

/** Publications newest year first; records are kept in source order within a year. */
export function groupPublicationsByYear(publications: Publication[]): PublicationYearGroup[] {
  const byYear = new Map<number, Publication[]>();
  for (const publication of publications) {
    const bucket = byYear.get(publication.year);
    if (bucket) bucket.push(publication);
    else byYear.set(publication.year, [publication]);
  }
  return [...byYear.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, items]) => ({ year, items }));
}

export type TeamRoleGroup = { role: string; members: Member[] };

/** Team grouped by role, preserving the role order in which they first appear. */
export function groupTeamByRole(team: Member[]): TeamRoleGroup[] {
  const groups = new Map<string, Member[]>();
  for (const member of team) {
    const bucket = groups.get(member.role);
    if (bucket) bucket.push(member);
    else groups.set(member.role, [member]);
  }
  return [...groups.entries()].map(([role, members]) => ({ role, members }));
}
