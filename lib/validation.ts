import { z } from 'zod';
import type { Content } from './types';

/**
 * Schema validation for the whole CMS content document.
 *
 * Design goals:
 *  - Content fields are length bounded (except free-form tags), and the whole
 *    request has a byte limit so broken clients cannot store unbounded payloads.
 *  - IDs are restricted to a filesystem-safe alphabet because picture group ids
 *    become directory names under data/pictures/<id>/.
 *  - URLs/paths are restricted to empty, same-site /media paths, locally staged
 *    upload paths, or absolute http(s)/mailto/tel links. javascript:/data: are
 *    rejected.
 *  - `tags` are intentionally free-form strings: no vocabulary validation.
 *  - Dates must be real calendar dates (YYYY-MM-DD) or a bare year (YYYY).
 */

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

export const LIMITS = {
  id: 64,
  shortText: 300,
  mediumText: 2_000,
  longText: 20_000,
  urlLength: 2_048,
  publications: 2_000,
  team: 500,
  research: 500,
  projects: 500,
  news: 2_000,
  events: 2_000,
  pictures: 500,
  groupImages: 500,
  /** Maximum accepted serialized Content body (defence-in-depth, route-level). */
  contentBytes: 6 * 1024 * 1024,
} as const;

/** Conservative filesystem/JSON-safe identifier alphabet. */
export const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

// ---------------------------------------------------------------------------
// Pure helpers (exported for focused unit tests)
// ---------------------------------------------------------------------------

export function isSafeId(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value);
}

export function isBareYear(value: string): boolean {
  if (!/^\d{4}$/.test(value)) return false;
  const year = Number(value);
  return year >= 1900 && year <= 2100;
}

/** Validates '' (unknown), 'YYYY' (1900-2100) or a real 'YYYY-MM-DD' date. */
export function isValidCalendarDate(value: string): boolean {
  if (value === '') return true;
  if (isBareYear(value)) return true;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const UNSAFE_SCHEME = /^\s*(javascript|data|vbscript|file)\s*:/i;

/**
 * A URL/path is safe when it is:
 *  - empty (fields such as `link` are optional), or
 *  - a same-site media path (`/media/...`) without traversal, or
 *  - a locally staged upload path (`/api/admin/uploads/<token>`), or
 *  - an absolute http(s) URL, or
 *  - a mailto:/tel: link (contact fields).
 */
export function isSafeUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (value === '') return true;
  if (CONTROL_CHARS.test(value)) return false;
  if (UNSAFE_SCHEME.test(value)) return false;
  if (value.startsWith('/')) {
    // Same-site path: reject protocol-relative and traversal.
    if (value.startsWith('//')) return false;
    if (value.includes('..')) return false;
    if (value.includes('\\')) return false;
    if (/^\/(media|api\/admin\/uploads)\//.test(value)) return true;
    if (value === '/') return true;
    // Known root static assets (e.g. /logo.svg) used for site branding.
    return /^\/[A-Za-z0-9][A-Za-z0-9._-]*\.(svg|png|jpe?g|webp|avif|gif|ico)$/i.test(value);
  }
  try {
    const url = new URL(value);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.hostname.length > 0;
    if (url.protocol === 'mailto:' || url.protocol === 'tel:') return true;
    return false;
  } catch {
    return false;
  }
}

/** Local media path shape: /media/<...> mapping to data/<...>. */
export function isLocalMediaPath(value: string): boolean {
  return /^\/media\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value) && !value.includes('..');
}

const STAGED_UPLOAD_RE = /^\/api\/admin\/uploads\/[a-f0-9]{32}$/;

/** Locally staged upload preview URL produced by POST /api/admin/upload. */
export function isStagedUploadUrl(value: unknown): value is string {
  return typeof value === 'string' && STAGED_UPLOAD_RE.test(value);
}

/**
 * Gallery images are directory rasters only: a staged upload token or an
 * own-group `/media/pictures/<id>/<stem>.webp` path. External or cross-group
 * URLs are rejected because they cannot be materialised by the media pipeline.
 */
export function isGalleryImageUrl(value: unknown, groupId: string): value is string {
  if (typeof value !== 'string') return false;
  if (isStagedUploadUrl(value)) return true;
  if (typeof groupId !== 'string' || !isSafeId(groupId)) return false;
  const escaped = groupId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^/media/pictures/${escaped}/[A-Za-z0-9][A-Za-z0-9._-]*\\.webp$`).test(value);
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const bounded = (max: number, min = 0) => z.string().trim().min(min).max(max);

const id = bounded(LIMITS.id, 1).refine(isSafeId, { message: 'unsafe identifier' });
// Tags have no vocabulary, length or category validation. The complete request
// still has a byte limit; only the string/array types are required for rendering.
const tags = z.array(z.string());
const dateField = bounded(10).refine(isValidCalendarDate, { message: 'invalid calendar date' });
const url = bounded(LIMITS.urlLength).refine(isSafeUrl, { message: 'unsafe url' });
const imageField = bounded(LIMITS.urlLength).refine(isSafeUrl, { message: 'unsafe image url' });

const partnerSchema = z
  .object({
    name: bounded(LIMITS.shortText),
    logo: imageField,
    product: imageField,
    productName: bounded(LIMITS.shortText),
    description: bounded(LIMITS.longText),
    link: url,
  })
  .strict();

const siteSchema = z
  .object({
    name: bounded(LIMITS.shortText),
    institution: bounded(LIMITS.shortText),
    tagline: bounded(LIMITS.shortText),
    about: bounded(LIMITS.longText),
    focus: bounded(LIMITS.mediumText),
    email: bounded(LIMITS.shortText),
    phone: bounded(80),
    address: bounded(LIMITS.shortText),
    logo: imageField,
    grantAmount: z.number().int().min(0).max(999_999_999_999).optional(),
    partners: z.array(partnerSchema).max(6).optional(),
    publicationYearImages: z.record(z.string().regex(/^\d{4}$/), imageField).optional(),
  })
  .strict();

const publicationSchema = z
  .object({
    id,
    title: bounded(500),
    authors: bounded(1_000),
    year: z.number().int().min(1900).max(2100),
    venue: bounded(500),
    tags,
    link: url,
    image: imageField.optional(),
  })
  .strict();

const memberSchema = z
  .object({
    id,
    name: bounded(LIMITS.shortText).refine((v) => v.trim().length > 0, { message: 'name is required' }),
    role: bounded(LIMITS.shortText).refine((v) => v.trim().length > 0, { message: 'role is required' }),
    position: bounded(LIMITS.shortText).refine((v) => v.trim().length > 0, { message: 'position is required' }),
    tagline: bounded(LIMITS.shortText).optional(),
    description: bounded(LIMITS.longText),
    image: imageField,
    link: url,
    tags,
  })
  .strict();

const researchSchema = z
  .object({
    id,
    title: bounded(500),
    description: bounded(LIMITS.longText),
    tags,
    image: imageField.optional().default(''),
  })
  .strict();

const projectCategory = z.enum(['inhouse', 'students', 'student']).optional().default('inhouse');

const projectSchema = researchSchema.extend({
  image: imageField,
  images: z.array(imageField).max(LIMITS.groupImages).optional().default([]),
  members: z.array(z.string()).optional().default([]),
  link: bounded(LIMITS.urlLength).refine((v) => v === '' || (v.startsWith('/') && !v.startsWith('//')) || isSafeUrl(v), { message: 'unsafe url' }),
  category: projectCategory,
  period: bounded(120).optional(),
});

const newsSchema = z
  .object({
    id,
    title: bounded(500),
    date: dateField,
    description: bounded(LIMITS.longText),
    tags,
    link: url,
  })
  .strict();

const eventSchema = newsSchema.extend({
  image: imageField,
  time: bounded(120),
  venue: bounded(LIMITS.shortText),
  showOnHome: z.boolean().optional(),
});

const pictureGroupSchema = z
  .object({
    id,
    name: bounded(LIMITS.shortText),
    date: dateField,
    description: bounded(LIMITS.mediumText),
    thumbnail: imageField,
    images: z.array(imageField).max(LIMITS.groupImages),
    tags: tags.optional(),
    showOnHome: z.boolean().optional(),
  })
  .strict()
  .superRefine((group, ctx) => {
    if (typeof group.id !== 'string') return;
    const check = (value: unknown, path: (string | number)[]) => {
      if (value === '') return;
      if (!isGalleryImageUrl(value, group.id)) {
        ctx.addIssue({
          code: 'custom',
          message: 'gallery image must be an own-group /media/pictures/<id>/<stem>.webp path or a staged upload',
          path,
        });
      }
    };
    check(group.thumbnail, ['thumbnail']);
    if (Array.isArray(group.images)) {
      group.images.forEach((image, index) => check(image, ['images', index]));
    }
  });

export const contentSchema = z
  .object({
    site: siteSchema,
    publications: z.array(publicationSchema).max(LIMITS.publications),
    team: z.array(memberSchema).max(LIMITS.team),
    research: z.array(researchSchema).max(LIMITS.research),
    projects: z.array(projectSchema).max(LIMITS.projects),
    news: z.array(newsSchema).max(LIMITS.news),
    events: z.array(eventSchema).max(LIMITS.events),
    pictures: z.array(pictureGroupSchema).max(LIMITS.pictures),
  })
  .strict()
  .superRefine((content, ctx) => {
    const collections = [
      ['publications', content.publications],
      ['team', content.team],
      ['research', content.research],
      ['projects', content.projects],
      ['news', content.news],
      ['events', content.events],
      ['pictures', content.pictures],
    ] as const;

    for (const [key, items] of collections) {
      if (!Array.isArray(items)) continue;
      const seen = new Set<string>();
      items.forEach((item, index) => {
        const id = (item as { id?: unknown })?.id;
        if (typeof id !== 'string') return;
        if (seen.has(id)) {
          ctx.addIssue({ code: 'custom', message: `duplicate id "${id}"`, path: [key, index, 'id'] });
        } else {
          seen.add(id);
        }
      });
    }
  });

export type ValidationIssue = { path: string; message: string };

export type ValidationResult =
  | { ok: true; content: Content }
  | { ok: false; issues: ValidationIssue[] };

/** Validates unknown input and returns either the normalised Content or issues. */
export function validateContent(input: unknown): ValidationResult {
  const parsed = contentSchema.safeParse(input);
  if (parsed.success) {
    return { ok: true, content: parsed.data as Content };
  }
  return {
    ok: false,
    issues: parsed.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  };
}
