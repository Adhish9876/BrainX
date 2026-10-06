import { mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  countSessionUploads,
  createUpload,
  deleteUpload,
  isUploadExpired,
  isUploadToken,
  listUploads,
  loadStagedForSession,
  MAX_UPLOAD_BYTES,
  processImage,
  pruneExpiredUploads,
  readUpload,
  sanitizeFilename,
  UploadError,
  UPLOAD_TTL_MS,
  uploadUrl,
} from '../lib/uploads';

let dir = '';

beforeEach(async () => {
  dir = await mkdtemp('/tmp/opencode/brainx-up-');
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function png(width = 8, height = 8): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: { r: 10, g: 20, b: 30 } } })
    .png()
    .toBuffer();
}

describe('upload helpers', () => {
  it('sanitises filenames and validates tokens', () => {
    expect(sanitizeFilename('../../etc/passwd')).toBe('passwd');
    expect(sanitizeFilename('photo.png')).toBe('photo.png');
    expect(sanitizeFilename('')).toBe('upload');
    expect(isUploadToken('a'.repeat(32))).toBe(true);
    expect(isUploadToken('Z'.repeat(32))).toBe(false);
    expect(uploadUrl('a'.repeat(32))).toBe(`/api/admin/uploads/${'a'.repeat(32)}`);
  });

  it('normalises rasters to webp and rejects non-images', async () => {
    const out = await processImage(await png());
    expect(out.format).toBe('png');
    expect(out.width).toBe(8);
    expect(out.data.subarray(0, 4).toString('ascii')).toBe('RIFF');

    await expect(processImage(Buffer.from('not an image'))).rejects.toBeInstanceOf(UploadError);
    await expect(processImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).rejects.toBeInstanceOf(
      UploadError,
    );
  });

  it('enforces the byte bound', async () => {
    const buffer = await png();
    await expect(processImage(buffer, { maxBytes: 4 })).rejects.toMatchObject({ status: 413 });
    expect(MAX_UPLOAD_BYTES).toBe(10 * 1024 * 1024);
  });

  it('bounds large photos while preserving their aspect ratio', async () => {
    const output = await processImage(await png(3000, 1500));
    expect([output.width, output.height]).toEqual([2560, 1280]);
    const metadata = await sharp(output.data).metadata();
    expect([metadata.width, metadata.height]).toEqual([2560, 1280]);
  });
});

describe('upload staging', () => {
  it('stores, reads and deletes session-bound uploads', async () => {
    const record = await createUpload({
      dir,
      sessionId: 'sess-1',
      originalName: 'photo.png',
      declaredType: 'image/png',
      buffer: await png(),
      now: 1_000,
    });
    expect(isUploadToken(record.token)).toBe(true);
    expect(record.sessionId).toBe('sess-1');
    expect(existsSync(path.join(dir, `${record.token}.webp`))).toBe(true);

    const loaded = await readUpload(dir, record.token, 1_500);
    expect(loaded?.data.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(loaded?.record.originalName).toBe('photo.png');

    await deleteUpload(dir, record.token);
    expect(await readUpload(dir, record.token, 1_500)).toBeNull();
  });

  it('expires uploads after the TTL', async () => {
    const record = await createUpload({
      dir,
      sessionId: 's',
      originalName: 'a.png',
      buffer: await png(),
      now: 0,
    });
    expect(isUploadExpired(record, UPLOAD_TTL_MS - 1)).toBe(false);
    expect(await readUpload(dir, record.token, UPLOAD_TTL_MS)).toBeNull();
  });

  it('bounds the number of uploads per session', async () => {
    await createUpload({ dir, sessionId: 's', originalName: 'a.png', buffer: await png(), now: 0, maxPerSession: 1 });
    await expect(
      createUpload({ dir, sessionId: 's', originalName: 'b.png', buffer: await png(), now: 1, maxPerSession: 1 }),
    ).rejects.toMatchObject({ status: 429 });
    expect(await countSessionUploads(dir, 's', 1)).toBe(1);
  });

  it('binds staged files to their session', async () => {
    const record = await createUpload({ dir, sessionId: 'owner', originalName: 'a.png', buffer: await png(), now: 0 });
    await expect(loadStagedForSession(dir, [record.token], 'owner', 1)).resolves.toBeInstanceOf(Map);
    await expect(loadStagedForSession(dir, [record.token], 'intruder', 1)).rejects.toBeInstanceOf(UploadError);
    await expect(loadStagedForSession(dir, ['f'.repeat(32)], 'owner', 1)).rejects.toBeInstanceOf(UploadError);
  });

  it('prunes expired uploads', async () => {
    const old = await createUpload({ dir, sessionId: 's', originalName: 'a.png', buffer: await png(), now: 0 });
    const fresh = await createUpload({ dir, sessionId: 's', originalName: 'b.png', buffer: await png(), now: UPLOAD_TTL_MS });
    const pruned = await pruneExpiredUploads(dir, UPLOAD_TTL_MS + 1);
    expect(pruned).toBe(1);
    const remaining = (await listUploads(dir)).map((r) => r.token);
    expect(remaining).toContain(fresh.token);
    expect(remaining).not.toContain(old.token);
  });
});
