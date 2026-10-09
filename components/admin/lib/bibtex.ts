/**
 * Client-safe BibTeX → publication field extraction.
 *
 * This module is intentionally free of server-only imports so it can run in the
 * admin editor (browser) and in node-based unit tests alike. It parses a single
 * BibTeX citation with Citation.js and maps the resulting CSL-JSON onto the
 * editable `Publication` fields.
 *
 * Parsing rules:
 *  - The input format is always forced to `@bibtex/text`. Forcing the text
 *    parser means Citation.js never tries to infer the input type (for example
 *    treating a bare URL/DOI as a remote resource to fetch).
 *  - Empty input, unparsable input, zero entries and more than one entry are
 *    rejected with a clear, safe error instead of silently importing a subset.
 *  - Only the fields named in {@link BibtexPublicationFields} are produced. No
 *    `id` is ever generated or changed here; the editor owns record identity.
 */

import { Cite, plugins } from '@citation-js/core';
import type { CSL, CSLName } from '@citation-js/core';
// Side-effect import: registers the documented `@bibtex/text` input format.
import '@citation-js/plugin-bibtex';

import type { Publication } from '@/lib/types';
import { isBareYear, isSafeUrl } from '@/lib/validation';

/** The publication fields an import may fill. `id` is deliberately excluded. */
export type BibtexPublicationFields = Partial<
  Pick<Publication, 'title' | 'authors' | 'year' | 'venue' | 'link' | 'tags'>
>;

export interface BibtexParseResult {
  fields: BibtexPublicationFields;
  warnings: string[];
}

/**
 * Hard cap on pasted text. Parsing is synchronous, so an unbounded paste could
 * freeze the editor; anything larger is rejected before Citation.js runs.
 */
export const MAX_BIBTEX_LENGTH = 100_000;

// These bounds mirror the publication schema in lib/validation.ts so extracted
// values always satisfy it. Over-long values are reported rather than emitted.
const TITLE_MAX = 500;
const AUTHORS_MAX = 1_000;
const VENUE_MAX = 500;
const URL_MAX = 2_048;

/** Force the documented BibTeX text parser; never let Citation.js infer a type. */
const BIBTEX_INPUT_OPTIONS = { forceType: '@bibtex/text' } as ConstructorParameters<typeof Cite>[1];

// ---------------------------------------------------------------------------
// Plain-text helpers (safe: never renders markup)
// ---------------------------------------------------------------------------

// Match real-looking tags (`<i>`, `</i>`, `<span style="...">`) but not bare
// comparisons such as `a < b > c`.
const HTML_TAG = /<[a-zA-Z/][^>]*>/g;
const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

function fromCodePoint(code: number): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return '';
  try {
    return String.fromCodePoint(code);
  } catch {
    return '';
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) => fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, dec: string) => fromCodePoint(parseInt(dec, 10)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    // Decoded last so `&amp;lt;` does not become `<`.
    .replace(/&amp;/gi, '&');
}

/**
 * Convert a value that may contain Citation.js CSL HTML markup (for example
 * `<i>`, `<span style="font-variant:small-caps;">`, `<sup>`) into plain text.
 * Entities are decoded, tags stripped, control characters removed and runs of
 * whitespace collapsed. Casing is preserved.
 */
export function toPlainText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return decodeHtmlEntities(value)
    .replace(HTML_TAG, '')
    .replace(CONTROL_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Field mappers
// ---------------------------------------------------------------------------

function formatAuthorName(name: CSLName): string {
  if (typeof name.literal === 'string' && name.literal.trim()) {
    return toPlainText(name.literal);
  }

  const family = typeof name.family === 'string' ? name.family.trim() : '';
  const given = typeof name.given === 'string' ? name.given.trim() : '';
  // BibTeX's `and others` parses to a nameless `others` entry meaning "et al.".
  if (/^others$/i.test(family) && !given) return 'et al.';

  return toPlainText(
    [given, name['dropping-particle'], name['non-dropping-particle'], name.family, name.suffix]
      .map(part => (typeof part === 'string' ? part.trim() : ''))
      .filter(Boolean)
      .join(' '),
  );
}

/** Render CSL names as readable, comma-separated "Given Family" names. */
function formatAuthors(author: CSLName[] | undefined): string {
  if (!Array.isArray(author)) return '';
  return author
    .map(formatAuthorName)
    .map(name => name.trim())
    .filter(Boolean)
    .join(', ');
}

function issuedYear(entry: CSL): number | undefined {
  const parts = entry.issued?.['date-parts'];
  const first = Array.isArray(parts) ? parts[0] : undefined;
  const value = Array.isArray(first) ? first[0] : undefined;
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^\d{1,4}$/.test(value.trim())) return Number(value.trim());
  return undefined;
}

/** Journal / booktitle / container-title, falling back to the publisher. */
function formatVenue(entry: CSL): string {
  const container = typeof entry['container-title'] === 'string' ? toPlainText(entry['container-title']) : '';
  if (container) return container;
  return typeof entry.publisher === 'string' ? toPlainText(entry.publisher) : '';
}

function isHttpUrl(value: string): boolean {
  if (!isSafeUrl(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Turn a raw DOI into an `https://doi.org/...` link when it is safe to do so. */
function doiToUrl(rawDoi: string): string | undefined {
  // Reject whitespace/control characters and anything that is not a bare DOI.
  if (/[\u0000-\u001f\u007f\s]/.test(rawDoi)) return undefined;
  if (/^https?:\/\//i.test(rawDoi)) return rawDoi;
  const bare = rawDoi.replace(/^doi:\s*/i, '');
  if (!bare) return undefined;
  return `https://doi.org/${bare}`;
}

/** Prefer the citation URL; fall back to an https://doi.org/ link. */
function resolveLink(entry: CSL, warnings: string[]): string | undefined {
  const rawUrl = typeof entry.URL === 'string' ? entry.URL.trim() : '';
  const rawDoi = typeof entry.DOI === 'string' ? entry.DOI.trim() : '';

  if (rawUrl) {
    if (rawUrl.length > URL_MAX) {
      warnings.push(`The URL is longer than ${URL_MAX} characters and was not filled.`);
    } else if (isHttpUrl(rawUrl)) {
      return rawUrl;
    } else {
      warnings.push('The URL in this citation is not a safe http(s) link and was ignored.');
    }
  }

  if (rawDoi) {
    const doiUrl = doiToUrl(rawDoi);
    if (!doiUrl) {
      warnings.push('The DOI in this citation could not be turned into a safe https://doi.org/ link and was ignored.');
    } else if (doiUrl.length > URL_MAX) {
      warnings.push(`The DOI link is longer than ${URL_MAX} characters and was not filled.`);
    } else if (isHttpUrl(doiUrl)) {
      return doiUrl;
    } else {
      warnings.push('The DOI in this citation could not be turned into a safe https://doi.org/ link and was ignored.');
    }
  }

  return undefined;
}

function splitTags(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of value.split(/[,;]/)) {
    const tag = toPlainText(part).replace(/^\{+|\}+$/g, '').trim();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
  }
  return tags;
}

/**
 * Read keywords. The CSL `keyword` field is only produced by Citation.js's
 * biblatex mapping, so when it is absent we read the raw entry properties, which
 * the documented `@bibtex/text` parser exposes with `@string` values resolved.
 */
function readTags(entry: CSL, input: string): string[] {
  if (typeof entry.keyword === 'string' && entry.keyword.trim()) {
    return splitTags(entry.keyword);
  }
  // Cheap guard: skip the second parse when the source cannot carry keywords.
  if (!/keywords/i.test(input)) return [];
  try {
    const entries = plugins.input.data(input, '@bibtex/text');
    const properties = Array.isArray(entries) && entries[0] ? entries[0].properties : undefined;
    if (!properties) return [];
    return splitTags(properties.keywords ?? properties.keyword ?? '');
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function extractFields(entry: CSL, input: string): BibtexParseResult {
  const fields: BibtexPublicationFields = {};
  const warnings: string[] = [];

  const title = typeof entry.title === 'string' ? toPlainText(entry.title) : '';
  if (title) {
    if (title.length > TITLE_MAX) {
      warnings.push(`The title is longer than ${TITLE_MAX} characters and was not filled.`);
    } else {
      fields.title = title;
    }
  }

  const authors = formatAuthors(entry.author);
  if (authors) {
    if (authors.length > AUTHORS_MAX) {
      warnings.push(`The author list is longer than ${AUTHORS_MAX} characters and was not filled.`);
    } else {
      fields.authors = authors;
    }
  }

  const year = issuedYear(entry);
  if (year !== undefined) {
    if (isBareYear(String(year))) {
      fields.year = year;
    } else {
      warnings.push(`The year ${year} is outside the supported range (1900-2100) and was not filled.`);
    }
  }

  const venue = formatVenue(entry);
  if (venue) {
    if (venue.length > VENUE_MAX) {
      warnings.push(`The venue is longer than ${VENUE_MAX} characters and was not filled.`);
    } else {
      fields.venue = venue;
    }
  }

  const link = resolveLink(entry, warnings);
  if (link) fields.link = link;

  const tags = readTags(entry, input);
  if (tags.length) fields.tags = tags;

  if (Object.keys(fields).length === 0) {
    warnings.push('No recognized publication fields were found in this citation.');
  } else {
    const missing = (['title', 'authors', 'year', 'venue'] as const).filter(key => fields[key] === undefined);
    if (missing.length) {
      warnings.push(`Not extracted: ${missing.join(', ')}. These fields are unchanged; review them before saving.`);
    }
  }

  return { fields, warnings: Array.from(new Set(warnings)) };
}

function parseEntries(input: string): CSL[] {
  const cite = new Cite(input, BIBTEX_INPUT_OPTIONS);
  return cite.format('data', { format: 'object' });
}

/**
 * Parse a single BibTeX citation into editable publication fields.
 *
 * @throws Error when the input is empty, too large, unparsable, contains no
 *   citation, or contains more than one citation. Messages are safe plain text
 *   and never echo raw markup back to the caller.
 */
export function parsePublicationBibtex(input: string): BibtexParseResult {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new Error('Paste a BibTeX citation to import.');
  }
  if (input.length > MAX_BIBTEX_LENGTH) {
    throw new Error(
      `This BibTeX is too large to import (limit ${MAX_BIBTEX_LENGTH.toLocaleString('en-US')} characters).`,
    );
  }

  let entries: CSL[];
  try {
    entries = parseEntries(input);
  } catch {
    throw new Error('This text could not be parsed as a BibTeX citation. Check the braces, quotes, and field names.');
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('No BibTeX citation was found. Paste one @article, @inproceedings, or similar entry.');
  }
  if (entries.length > 1) {
    throw new Error(`Paste exactly one BibTeX citation. This text contains ${entries.length} entries.`);
  }

  return extractFields(entries[0], input);
}
