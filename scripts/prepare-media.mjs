#!/usr/bin/env node
/**
 * prepare-media.mjs — prebuild media pipeline.
 *
 * Maps every committed raster under `data/` to the normalized web assets served
 * from `public/media/`:
 *
 *   - gallery images : data/pictures/<id>/<file>.<ext> -> public/media/pictures/<id>/<stem>.webp
 *   - plain uploads  : data/uploads/<token>.<ext>      -> public/media/uploads/<stem>.webp
 *
 * These are exactly the URL shapes produced by `getContent()` in `lib/content.ts`
 * and by the CMS commit flow in `lib/github.ts` (`/media/pictures/...` and
 * `/media/uploads/...`). WebP sources are copied verbatim; other rasters are
 * transcoded with sharp.
 *
 * The script is idempotent and self-cleaning: outputs newer than their source are
 * skipped, and any `.webp` under the managed output directories that no longer
 * has a source is removed (so deleted records do not linger and 404-free).
 *
 * Intended to run before `next build` (e.g. as a `prebuild` script). Set
 * `MEDIA_ROOT` to operate on an alternate project root (used by tests).
 */
import { copyFile, mkdir, readdir, rmdir, stat, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const RASTER_RE = /\.(png|jpe?g|webp|avif|gif|tiff?|bmp)$/i;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = process.env.MEDIA_ROOT ? path.resolve(process.env.MEDIA_ROOT) : path.resolve(scriptDir, '..');

const dataPicturesDir = path.join(root, 'data', 'pictures');
const dataUploadsDir = path.join(root, 'data', 'uploads');
const outRootDir = path.join(root, 'public', 'media');
const outPicturesDir = path.join(outRootDir, 'pictures');
const outUploadsDir = path.join(outRootDir, 'uploads');

function toStem(file) {
  return RASTER_RE.test(file) ? file.replace(RASTER_RE, '') : file;
}

async function isDir(p) {
  try {
    return (await stat(p)).isDirectory();
  } catch {
    return false;
  }
}

async function listRasters(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && RASTER_RE.test(entry.name))
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

async function isUpToDate(source, target) {
  try {
    const [src, out] = await Promise.all([stat(source), stat(target)]);
    return out.mtimeMs >= src.mtimeMs && out.size > 0;
  } catch {
    return false;
  }
}

/** Copy WebP sources verbatim; transcode every other raster to WebP. */
async function materialize(source, target) {
  await mkdir(path.dirname(target), { recursive: true });
  if (path.extname(source).toLowerCase() === '.webp') {
    await copyFile(source, target);
    return;
  }
  await sharp(source, { failOn: 'none' })
    .rotate()
    .resize({ width: 2200, height: 2200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toFile(target);
}

async function walkWebp(dir) {
  const found = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await walkWebp(full)));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.webp')) found.push(full);
  }
  return found;
}

/** Recursively collect subdirectories (excluding `dir` itself). */
async function listDirs(dir) {
  const dirs = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return dirs;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    dirs.push(full, ...(await listDirs(full)));
  }
  return dirs;
}

/** Remove managed outputs that no longer have a source, then empty dirs. */
async function pruneOrphans(outputDir, expected) {
  if (!existsSync(outputDir)) return 0;
  let removed = 0;
  for (const file of await walkWebp(outputDir)) {
    if (!expected.has(file)) {
      await unlink(file).catch(() => {});
      removed += 1;
    }
  }
  // Tidy up directories that are now empty (best-effort, deepest first).
  for (const dir of (await listDirs(outputDir)).sort((a, b) => b.length - a.length)) {
    try {
      if ((await readdir(dir)).length === 0) await rmdir(dir);
    } catch {
      /* ignore */
    }
  }
  return removed;
}

async function main() {
  const expected = new Set();
  let written = 0;
  let skipped = 0;
  let failed = 0;

  // --- Gallery groups: data/pictures/<id>/<file> ---
  if (existsSync(dataPicturesDir)) {
    const groups = (await readdir(dataPicturesDir, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    for (const group of groups) {
      const groupDir = path.join(dataPicturesDir, group);
      for (const file of await listRasters(groupDir)) {
        const source = path.join(groupDir, file);
        const target = path.join(outPicturesDir, group, `${toStem(file)}.webp`);
        expected.add(target);
        if (await isUpToDate(source, target)) {
          skipped += 1;
          continue;
        }
        try {
          await materialize(source, target);
          written += 1;
          console.log(`[prepare-media] ${path.relative(root, source)} -> ${path.relative(root, target)}`);
        } catch (error) {
          failed += 1;
          console.error(`[prepare-media] failed for ${path.relative(root, source)}:`, error?.message ?? error);
        }
      }
    }
  }

  // --- Plain uploads: data/uploads/<token>.<ext> ---
  for (const file of await listRasters(dataUploadsDir)) {
    const source = path.join(dataUploadsDir, file);
    const target = path.join(outUploadsDir, `${toStem(file)}.webp`);
    expected.add(target);
    if (await isUpToDate(source, target)) {
      skipped += 1;
      continue;
    }
    try {
      await materialize(source, target);
      written += 1;
      console.log(`[prepare-media] ${path.relative(root, source)} -> ${path.relative(root, target)}`);
    } catch (error) {
      failed += 1;
      console.error(`[prepare-media] failed for ${path.relative(root, source)}:`, error?.message ?? error);
    }
  }

  // --- Self-cleaning: drop managed outputs without a source ---
  const prunedPictures = await pruneOrphans(outPicturesDir, expected);
  const prunedUploads = await pruneOrphans(outUploadsDir, expected);
  const pruned = prunedPictures + prunedUploads;

  console.log(
    `[prepare-media] done. written=${written} skipped=${skipped} pruned=${pruned} failed=${failed}`,
  );
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error('[prepare-media] unexpected error:', error);
  process.exitCode = 1;
});
