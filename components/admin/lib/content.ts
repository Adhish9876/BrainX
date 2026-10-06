import type { Content, Site } from '@/lib/types';

import {
  COLLECTIONS,
  type Collection,
  type RecordValue,
} from './content-types';
import { newId } from './ids';

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'tags'
  | 'image'
  | 'url';

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  help?: string;
  rows?: number;
}

/** Field order is chosen to match how each record reads on the public site. */
export const RECORD_FIELDS: Record<Collection, FieldDef[]> = {
  publications: [
    { key: 'title', label: 'Title', kind: 'text', placeholder: 'Paper title' },
    { key: 'authors', label: 'Authors', kind: 'text', placeholder: 'Comma-separated author list' },
    { key: 'year', label: 'Year', kind: 'number', placeholder: '2026' },
    { key: 'venue', label: 'Venue', kind: 'text', placeholder: 'Journal or conference' },
    { key: 'link', label: 'Link', kind: 'url', placeholder: 'https://…' },
    { key: 'tags', label: 'Tags', kind: 'tags' },
  ],
  team: [
    { key: 'name', label: 'Name', kind: 'text', placeholder: 'Full name' },
    { key: 'role', label: 'Role', kind: 'text', placeholder: 'e.g. Principal Investigator' },
    { key: 'position', label: 'Position', kind: 'text', placeholder: 'e.g. Assistant Professor, Dept. of CSE' },
    { key: 'description', label: 'Description', kind: 'textarea', rows: 5, placeholder: 'Short biography' },
    { key: 'image', label: 'Photo', kind: 'image' },
    { key: 'link', label: 'Link', kind: 'url', placeholder: 'https://…' },
    { key: 'tags', label: 'Tags', kind: 'tags' },
  ],
  research: [
    { key: 'title', label: 'Title', kind: 'text', placeholder: 'Research area' },
    { key: 'description', label: 'Description', kind: 'textarea', rows: 4 },
    { key: 'tags', label: 'Tags', kind: 'tags' },
  ],
  projects: [
    { key: 'title', label: 'Title', kind: 'text', placeholder: 'Project name' },
    { key: 'description', label: 'Description', kind: 'textarea', rows: 4 },
    { key: 'image', label: 'Image', kind: 'image' },
    { key: 'link', label: 'Link', kind: 'url', placeholder: 'https://…' },
    { key: 'tags', label: 'Tags', kind: 'tags' },
  ],
  news: [
    { key: 'title', label: 'Title', kind: 'text' },
    { key: 'date', label: 'Date', kind: 'date' },
    { key: 'description', label: 'Description', kind: 'textarea', rows: 4 },
    { key: 'link', label: 'Link', kind: 'url', placeholder: 'https://…' },
    { key: 'tags', label: 'Tags', kind: 'tags' },
  ],
  events: [
    { key: 'title', label: 'Title', kind: 'text' },
    { key: 'date', label: 'Date', kind: 'date' },
    { key: 'time', label: 'Time', kind: 'text', placeholder: 'e.g. 10:00 AM' },
    { key: 'venue', label: 'Venue', kind: 'text' },
    { key: 'description', label: 'Description', kind: 'textarea', rows: 4 },
    { key: 'image', label: 'Image', kind: 'image' },
    { key: 'link', label: 'Link', kind: 'url', placeholder: 'https://…' },
    { key: 'tags', label: 'Tags', kind: 'tags' },
  ],
  pictures: [
    { key: 'name', label: 'Name', kind: 'text', placeholder: 'Group name' },
    { key: 'date', label: 'Date', kind: 'date' },
    { key: 'description', label: 'Description', kind: 'textarea', rows: 4 },
  ],
};

/** Field used as the human-readable name of a record. */
export const PRIMARY_FIELD: Record<Collection, string> = {
  publications: 'title',
  team: 'name',
  research: 'title',
  projects: 'title',
  news: 'title',
  events: 'title',
  pictures: 'name',
};

/** Human-friendly label for a record, used in lists and change summaries. */
export function recordLabel(
  collection: Collection,
  record: RecordValue | undefined,
): string {
  if (!record) return 'Untitled';
  const value = record[PRIMARY_FIELD[collection]];
  if (typeof value === 'string' && value.trim()) return value.trim();
  const id = record.id;
  if (typeof id === 'string' && id) return `Untitled (${id.slice(0, 8)})`;
  return 'Untitled';
}

/** A brand new, empty record for the given collection with a fresh id. */
export function createRecord(collection: Collection): RecordValue {
  const id = newId();
  switch (collection) {
    case 'publications':
      return { id, title: '', authors: '', year: new Date().getFullYear(), venue: '', tags: [], link: '' };
    case 'team':
      return { id, name: '', role: '', position: '', description: '', image: '', link: '', tags: [] };
    case 'research':
      return { id, title: '', description: '', tags: [] };
    case 'projects':
      return { id, title: '', description: '', tags: [], image: '', link: '' };
    case 'news':
      return { id, title: '', date: '', description: '', tags: [], link: '' };
    case 'events':
      return { id, title: '', date: '', description: '', tags: [], link: '', image: '', time: '', venue: '' };
    case 'pictures':
      return { id, name: '', date: '', description: '', thumbnail: '', images: [] };
  }
}

export function updateSite(draft: Content, patch: Partial<Site>): Content {
  return { ...draft, site: { ...draft.site, ...patch } };
}

function listOf(draft: Content, collection: Collection): RecordValue[] {
  return draft[collection] as unknown as RecordValue[];
}

export function replaceRecord(
  draft: Content,
  collection: Collection,
  id: string,
  record: RecordValue,
): Content {
  const next = listOf(draft, collection).map((item) =>
    item.id === id ? record : item,
  );
  return { ...draft, [collection]: next } as Content;
}

export function addRecord(
  draft: Content,
  collection: Collection,
  record: RecordValue,
): Content {
  const next = [...listOf(draft, collection), record];
  return { ...draft, [collection]: next } as Content;
}

export function removeRecord(
  draft: Content,
  collection: Collection,
  id: string,
): Content {
  const next = listOf(draft, collection).filter((item) => item.id !== id);
  return { ...draft, [collection]: next } as Content;
}

export function moveRecord(
  draft: Content,
  collection: Collection,
  id: string,
  direction: -1 | 1,
): Content {
  const list = [...listOf(draft, collection)];
  const index = list.findIndex((item) => item.id === id);
  if (index < 0) return draft;
  const target = index + direction;
  if (target < 0 || target >= list.length) return draft;
  const [item] = list.splice(index, 1);
  list.splice(target, 0, item);
  return { ...draft, [collection]: list } as Content;
}

/** Structural clone used when promoting a draft record into the committed copy. */
export function cloneContent(content: Content): Content {
  return JSON.parse(JSON.stringify(content)) as Content;
}

export { COLLECTIONS };
