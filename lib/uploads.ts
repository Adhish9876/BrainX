import { randomBytes } from 'node:crypto';
import { mkdir, readFile, readdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Session-bound image staging for the admin CMS.
 *
 * Uploads are validated and normalised server-side with sharp (raster only,
 * size/dimension bounded), written as WebP under a temporary server directory,
 * and referenced by an opaque token. Records expire after 24h and are bound to
 * the admin session that created them. Nothing here is written into the repo;
 * committing copies the staged bytes into git via `lib/github.ts`.
 */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_UPLOADS_PER_SESSION = 40;
export const UPLOAD_TTL_MS = 24 * 60 * 60 * 1000;
export const MAX_IMAGE_DIMENSION = 12_000;
export const MAX_IMAGE_PIXELS = 40_000_000;
export const MAX_OUTPUT_DIMENSION = 2560;
export const WEBP_QUALITY = 82;

/** sharp format names accepted as raster input (SVG and raw are excluded). */
const RASTER_FORMATS = new Set(['jpeg', 'png', 'webp', 'gif', 'avif', 'tiff', 'heif', 'bmp']);

const TOKEN_RE = /^[a-f0-9]{32}$/;

export class UploadError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'UploadError';
    this.status = status;
  }
}

export type UploadRecord = {
  token: string;
  sessionId: string;
  originalName: string;
  /** Always image/webp after normalisation. */
  mime: string;
  /** Client-declared content type, kept for diagnostics only. */
  declaredType: string;
  size: number;
  width: number;
  height: number;
  format: string;
  createdAt: number;
};

export function uploadDir(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.UPLOAD_DIR?.trim() || '.uploads';
  return path.resolve(process.cwd(), configured);
}

export async function ensureUploadDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export function isUploadToken(token: unknown): token is string {
  return typeof token === 'string' && TOKEN_RE.test(token);
}

export function uploadUrl(token: string): string {
  return `/api/admin/uploads/${token}`;
}

/** Reduce an arbitrary filename to a short, safe label for records. */
export function sanitizeFilename(name: unknown): string {
  if (typeof name !== 'string') return 'upload';
  const base = name.split(/[\\/]/).pop() ?? '';
  // eslint-disable-next-line no-control-regex
  const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return cleaned.slice(0, 120) || 'upload';
}

export function isUploadExpired(record: Pick<UploadRecord, 'createdAt'>, now: number): boolean {
  return now - record.createdAt >= UPLOAD_TTL_MS;
}

// ---------------------------------------------------------------------------
// Image processing
// ---------------------------------------------------------------------------

export type ProcessedImage = { data: Buffer; width: number; height: number; format: string };

/** Validate a raster buffer and normalise it to WebP. */
export async function processImage(
  buffer: Buffer,
  options: { maxBytes?: number } = {},
): Promise<ProcessedImage> {
  const maxBytes = options.maxBytes ?? MAX_UPLOAD_BYTES;
  if (buffer.length === 0) throw new UploadError('empty upload', 400);
  if (buffer.length > maxBytes) throw new UploadError('file too large', 413);

  let meta;
  try {
    meta = await sharp(buffer, { failOn: 'error', limitInputPixels: MAX_IMAGE_PIXELS }).metadata();
  } catch {
    throw new UploadError('unsupported or corrupt image', 415);
  }

  const format = (meta.format ?? '').toLowerCase();
  if (!RASTER_FORMATS.has(format)) throw new UploadError('unsupported image format', 415);

  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) throw new UploadError('unsupported image', 415);
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    throw new UploadError('image dimensions too large', 413);
  }

  let data: Buffer;
  let outputWidth = width;
  let outputHeight = height;
  try {
    const result = await sharp(buffer, { failOn: 'error', limitInputPixels: MAX_IMAGE_PIXELS })
      .rotate()
      .resize({ width: MAX_OUTPUT_DIMENSION, height: MAX_OUTPUT_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    data = result.data;
    outputWidth = result.info.width;
    outputHeight = result.info.height;
  } catch {
    throw new UploadError('failed to process image', 415);
  }

  return { data, width: outputWidth, height: outputHeight, format };
}

// ---------------------------------------------------------------------------
// Record storage
// ---------------------------------------------------------------------------

function recordPath(dir: string, token: string): string {
  return path.join(dir, `${token}.json`);
}

function imagePath(dir: string, token: string): string {
  return path.join(dir, `${token}.webp`);
}

async function readRecordFile(dir: string, token: string): Promise<UploadRecord | null> {
  if (!isUploadToken(token)) return null;
  try {
    const raw = await readFile(recordPath(dir, token), 'utf8');
    const record = JSON.parse(raw) as UploadRecord;
    if (!record || record.token !== token || typeof record.createdAt !== 'number') return null;
    return record;
  } catch {
    return null;
  }
}

export async function listUploads(dir: string): Promise<UploadRecord[]> {
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return [];
  }
  const records: UploadRecord[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const token = file.slice(0, -'.json'.length);
    const record = await readRecordFile(dir, token);
    if (record) records.push(record);
  }
  return records;
}

/** Count a session's non-expired staged uploads. */
export async function countSessionUploads(
  dir: string,
  sessionId: string,
  now: number = Date.now(),
): Promise<number> {
  const records = await listUploads(dir);
  return records.filter((r) => r.sessionId === sessionId && !isUploadExpired(r, now)).length;
}

export type CreateUploadInput = {
  dir: string;
  sessionId: string;
  originalName: string;
  declaredType?: string;
  buffer: Buffer;
  now?: number;
  maxBytes?: number;
  maxPerSession?: number;
};

export async function createUpload(input: CreateUploadInput): Promise<UploadRecord> {
  const now = input.now ?? Date.now();
  const maxPerSession = input.maxPerSession ?? MAX_UPLOADS_PER_SESSION;

  await ensureUploadDir(input.dir);
  const existing = await countSessionUploads(input.dir, input.sessionId, now);
  if (existing >= maxPerSession) throw new UploadError('too many staged uploads for this session', 429);

  const processed = await processImage(input.buffer, { maxBytes: input.maxBytes });
  const token = randomBytes(16).toString('hex');

  const record: UploadRecord = {
    token,
    sessionId: input.sessionId,
    originalName: sanitizeFilename(input.originalName),
    mime: 'image/webp',
    declaredType: typeof input.declaredType === 'string' ? input.declaredType.slice(0, 120) : '',
    size: processed.data.length,
    width: processed.width,
    height: processed.height,
    format: processed.format,
    createdAt: now,
  };

  const image = imagePath(input.dir, token);
  const tmp = `${image}.tmp`;
  try {
    await writeFile(tmp, processed.data);
    await rename(tmp, image);
    await writeFile(recordPath(input.dir, token), `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  } catch {
    await Promise.allSettled([unlink(tmp), unlink(image)]);
    throw new UploadError('failed to store upload', 500);
  }

  return record;
}

export type LoadedUpload = { record: UploadRecord; data: Buffer };

/** Read a staged upload, enforcing token validity and expiry. */
export async function readUpload(
  dir: string,
  token: string,
  now: number = Date.now(),
): Promise<LoadedUpload | null> {
  const record = await readRecordFile(dir, token);
  if (!record) return null;
  if (isUploadExpired(record, now)) return null;
  try {
    const data = await readFile(imagePath(dir, token));
    return { record, data };
  } catch {
    return null;
  }
}

/**
 * Load staged buffers for commit, verifying each token belongs to `sessionId`
 * and has not expired. Throws UploadError(400) when a referenced token is
 * missing, foreign or stale.
 */
export async function loadStagedForSession(
  dir: string,
  tokens: Iterable<string>,
  sessionId: string,
  now: number = Date.now(),
): Promise<Map<string, Buffer>> {
  const result = new Map<string, Buffer>();
  for (const token of tokens) {
    const loaded = await readUpload(dir, token, now);
    if (!loaded || loaded.record.sessionId !== sessionId) {
      throw new UploadError(`staged upload ${token} is missing or not owned by this session`, 400);
    }
    result.set(token, loaded.data);
  }
  return result;
}

export async function deleteUpload(dir: string, token: string): Promise<void> {
  if (!isUploadToken(token)) return;
  await Promise.allSettled([unlink(imagePath(dir, token)), unlink(recordPath(dir, token))]);
}

/** Remove expired records and their files; returns the number of records pruned. */
export async function pruneExpiredUploads(dir: string, now: number = Date.now()): Promise<number> {
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return 0;
  }
  let pruned = 0;
  const knownTokens = new Set<string>();
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const token = file.slice(0, -'.json'.length);
    const record = await readRecordFile(dir, token);
    if (record && !isUploadExpired(record, now)) {
      knownTokens.add(token);
      continue;
    }
    await deleteUpload(dir, token);
    pruned += 1;
  }

  // Orphan images without a live record.
  for (const file of files) {
    if (!file.endsWith('.webp')) continue;
    const token = file.slice(0, -'.webp'.length);
    if (knownTokens.has(token)) continue;
    try {
      const info = await stat(path.join(dir, file));
      if (now - info.mtimeMs >= UPLOAD_TTL_MS) await unlink(path.join(dir, file));
    } catch {
      /* ignore */
    }
  }
  return pruned;
}
