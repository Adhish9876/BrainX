import { randomBytes } from 'node:crypto';
import { mkdir, readFile, readdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { del as blobDel, get as blobGet, list as blobList, put as blobPut } from '@vercel/blob';

/**
 * Session-bound image staging for the admin CMS.
 *
 * Uploads are validated and normalised server-side with sharp (raster only,
 * size/dimension bounded), written as WebP under a temporary server directory,
 * and referenced by an opaque token. Records expire after 24h and are bound to
 * the admin session that created them. Nothing here is written into the repo;
 * committing copies the staged bytes into git via `lib/github.ts`.
 *
 * Storage: a local directory by default (dev server, VPS). When `BLOB_READ_WRITE_TOKEN` is set
 * (Vercel, where there is no persistent disk) the same records live in Vercel Blob instead, so a
 * photo uploaded in one request can be read by the next one, even on another serverless instance.
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

// ---------------------------------------------------------------------------
// Vercel Blob backend (used when BLOB_READ_WRITE_TOKEN is set)
// ---------------------------------------------------------------------------

export function blobEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.BLOB_READ_WRITE_TOKEN?.trim());
}

/** Which access mode the Blob store uses. Starts from BLOB_ACCESS (default private) and self-corrects. */
let accessMode: 'public' | 'private' = process.env.BLOB_ACCESS === 'public' ? 'public' : 'private';

/** Run a Blob call; if the store rejects the access mode (public vs private store), retry with the other. */
async function withBlobAccess<T>(run: (access: 'public' | 'private') => Promise<T>): Promise<T> {
  try {
    return await run(accessMode);
  } catch (first) {
    const other = accessMode === 'private' ? 'public' : 'private';
    try {
      const result = await run(other);
      accessMode = other;
      return result;
    } catch {
      throw first;
    }
  }
}

/** On Vercel there is no persistent disk, so uploads need the Blob store to be connected. */
function assertStorageAvailable(): void {
  if (process.env.VERCEL && !blobEnabled()) {
    throw new UploadError(
      'Photo storage is not connected. In Vercel open this project > Storage, create a Blob store and connect it to the project, then redeploy.',
      503,
    );
  }
}

const blobImagePath = (token: string) => `staged/${token}.webp`;
const blobRecordPath = (token: string) => `staged/${token}.json`;

async function blobReadBytes(pathname: string): Promise<Buffer | null> {
  try {
    const result = await withBlobAccess((access) => blobGet(pathname, { access, useCache: false }));
    if (!result || !result.stream) return null;
    return Buffer.from(await new Response(result.stream).arrayBuffer());
  } catch {
    return null;
  }
}

async function blobReadRecord(token: string): Promise<UploadRecord | null> {
  if (!isUploadToken(token)) return null;
  const bytes = await blobReadBytes(blobRecordPath(token));
  if (!bytes) return null;
  try {
    const record = JSON.parse(bytes.toString('utf8')) as UploadRecord;
    if (!record || record.token !== token || typeof record.createdAt !== 'number') return null;
    return record;
  } catch {
    return null;
  }
}

async function blobListRecords(): Promise<UploadRecord[]> {
  const records: UploadRecord[] = [];
  let cursor: string | undefined;
  do {
    const page = await blobList({ prefix: 'staged/', limit: 500, cursor });
    for (const blob of page.blobs) {
      if (!blob.pathname.endsWith('.json')) continue;
      const token = blob.pathname.slice('staged/'.length, -'.json'.length);
      const record = await blobReadRecord(token);
      if (record) records.push(record);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return records;
}

async function blobDeleteUpload(token: string): Promise<void> {
  await Promise.allSettled([blobDel(blobImagePath(token)), blobDel(blobRecordPath(token))]);
}

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
  if (blobEnabled()) return blobListRecords();
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

  assertStorageAvailable();
  if (!blobEnabled()) await ensureUploadDir(input.dir);
  await pruneExpiredUploads(input.dir, now);
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

  if (blobEnabled()) {
    try {
      await withBlobAccess((access) =>
        blobPut(blobImagePath(token), processed.data, {
          access,
          contentType: 'image/webp',
          addRandomSuffix: false,
          allowOverwrite: true,
        }),
      );
      await withBlobAccess((access) =>
        blobPut(blobRecordPath(token), JSON.stringify(record), {
          access,
          contentType: 'application/json',
          addRandomSuffix: false,
          allowOverwrite: true,
        }),
      );
    } catch (error) {
      console.error('[upload] Vercel Blob write failed:', error instanceof Error ? error.message : error);
      await blobDeleteUpload(token);
      throw new UploadError(
        `Photo storage rejected the upload (${error instanceof Error ? error.message.slice(0, 140) : 'unknown error'}).`,
        500,
      );
    }
    return record;
  }

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
  if (blobEnabled()) {
    const blobRecord = await blobReadRecord(token);
    if (!blobRecord || isUploadExpired(blobRecord, now)) return null;
    const bytes = await blobReadBytes(blobImagePath(token));
    return bytes ? { record: blobRecord, data: bytes } : null;
  }
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
  if (blobEnabled()) return blobDeleteUpload(token);
  await Promise.allSettled([unlink(imagePath(dir, token)), unlink(recordPath(dir, token))]);
}

/** Remove expired records and their files; returns the number of records pruned. */
export async function pruneExpiredUploads(dir: string, now: number = Date.now()): Promise<number> {
  if (blobEnabled()) {
    let pruned = 0;
    for (const record of await blobListRecords()) {
      if (isUploadExpired(record, now)) {
        await blobDeleteUpload(record.token);
        pruned += 1;
      }
    }
    return pruned;
  }
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
