import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';

// In-memory stand-in for Vercel Blob, keyed by pathname.
const store = new Map<string, { body: Buffer; contentType: string }>();

vi.mock('@vercel/blob', () => ({
  put: async (pathname: string, body: Buffer | string, options: { contentType?: string }) => {
    store.set(pathname, { body: Buffer.from(body), contentType: options.contentType ?? '' });
    return { pathname, url: `https://blob.test/${pathname}` };
  },
  get: async (pathname: string) => {
    const hit = store.get(pathname);
    if (!hit) return null;
    return { stream: new Response(new Uint8Array(hit.body)).body, headers: new Headers(), blob: { pathname } };
  },
  del: async (pathname: string) => {
    store.delete(pathname);
  },
  list: async ({ prefix }: { prefix?: string }) => ({
    blobs: [...store.keys()].filter((k) => k.startsWith(prefix ?? '')).map((pathname) => ({ pathname, url: `https://blob.test/${pathname}` })),
    hasMore: false,
    cursor: undefined,
  }),
}));

import {
  blobEnabled,
  createUpload,
  deleteUpload,
  loadStagedForSession,
  pruneExpiredUploads,
  readUpload,
  UPLOAD_TTL_MS,
} from '../lib/uploads';

async function png(): Promise<Buffer> {
  return sharp({ create: { width: 8, height: 8, channels: 3, background: '#336699' } }).png().toBuffer();
}

describe('upload staging in Vercel Blob mode', () => {
  beforeEach(() => {
    store.clear();
    process.env.BLOB_READ_WRITE_TOKEN = 'test-token';
  });
  afterEach(() => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
  });

  it('is enabled by the token', () => {
    expect(blobEnabled()).toBe(true);
  });

  it('stores, reads back and deletes a staged image without touching the disk', async () => {
    const record = await createUpload({ dir: '/nonexistent', sessionId: 's1', originalName: 'a.png', buffer: await png() });
    expect(store.has(`staged/${record.token}.webp`)).toBe(true);
    expect(store.has(`staged/${record.token}.json`)).toBe(true);

    const loaded = await readUpload('/nonexistent', record.token);
    expect(loaded?.record.sessionId).toBe('s1');
    expect(loaded?.data.length).toBeGreaterThan(0);

    const staged = await loadStagedForSession('/nonexistent', [record.token], 's1');
    expect(staged.get(record.token)?.length).toBe(loaded?.data.length);
    await expect(loadStagedForSession('/nonexistent', [record.token], 'someone-else')).rejects.toThrow();

    await deleteUpload('/nonexistent', record.token);
    expect(await readUpload('/nonexistent', record.token)).toBeNull();
  });

  it('prunes expired staged images', async () => {
    const record = await createUpload({ dir: '/nonexistent', sessionId: 's1', originalName: 'a.png', buffer: await png(), now: 1000 });
    expect(await pruneExpiredUploads('/nonexistent', 1000 + UPLOAD_TTL_MS + 1)).toBe(1);
    expect(store.size).toBe(0);
    expect(await readUpload('/nonexistent', record.token, 1000 + UPLOAD_TTL_MS + 1)).toBeNull();
  });
});
