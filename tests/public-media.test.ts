import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SCRIPT = fileURLToPath(new URL('../scripts/prepare-media.mjs', import.meta.url));
const tempRoots: string[] = [];

async function makeRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'brainx-media-'));
  tempRoots.push(root);
  return root;
}

function runPipeline(root: string) {
  const result = spawnSync(process.execPath, [SCRIPT], {
    env: { ...process.env, MEDIA_ROOT: root },
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`prepare-media failed (${result.status}):\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
}

async function makePng(target: string) {
  await mkdir(path.dirname(target), { recursive: true });
  await sharp({ create: { width: 12, height: 8, channels: 3, background: '#2C4A87' } })
    .png()
    .toFile(target);
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('media pipeline', () => {
  it('compiles plain uploads to /media/uploads/<stem>.webp and prunes stale outputs', async () => {
    const root = await makeRoot();
    const source = path.join(root, 'data', 'uploads', 'a1b2c3d4e5f60718293a4b5c6d7e8f90.png');
    const output = path.join(root, 'public', 'media', 'uploads', 'a1b2c3d4e5f60718293a4b5c6d7e8f90.webp');

    await makePng(source);
    runPipeline(root);

    expect(existsSync(output)).toBe(true);
    const meta = await sharp(output).metadata();
    expect(meta.format).toBe('webp');

    // Removing the committed source must remove the served asset (no stale 404s).
    await rm(source);
    runPipeline(root);
    expect(existsSync(output)).toBe(false);
  });

  it('copies WebP uploads verbatim without re-encoding', async () => {
    const root = await makeRoot();
    const source = path.join(root, 'data', 'uploads', 'ffffffffffffffffffffffffffffffff.webp');
    const output = path.join(root, 'public', 'media', 'uploads', 'ffffffffffffffffffffffffffffffff.webp');
    await mkdir(path.dirname(source), { recursive: true });
    await sharp({ create: { width: 10, height: 10, channels: 3, background: '#191a1e' } })
      .webp({ quality: 90 })
      .toFile(source);

    runPipeline(root);

    expect(existsSync(output)).toBe(true);
    expect((await readFile(output)).equals(await readFile(source))).toBe(true);
  });

  it('compiles gallery groups and prunes stale images', async () => {
    const root = await makeRoot();
    const source = path.join(root, 'data', 'pictures', 'group-x', 'photo-01.png');
    const output = path.join(root, 'public', 'media', 'pictures', 'group-x', 'photo-01.webp');

    await makePng(source);
    runPipeline(root);
    expect(existsSync(output)).toBe(true);

    await rm(source);
    runPipeline(root);
    expect(existsSync(output)).toBe(false);
    // The now-empty managed group directory is tidied away.
    await expect(stat(path.join(root, 'public', 'media', 'pictures', 'group-x'))).rejects.toThrow();
  });

  it('keeps the committed demo gallery compiled in the real tree', async () => {
    const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
    runPipeline(root);
    for (const stem of ['demo-01', 'demo-02']) {
      expect(existsSync(path.join(root, 'public', 'media', 'pictures', 'demo-gallery', `${stem}.webp`))).toBe(true);
    }
  });
});
