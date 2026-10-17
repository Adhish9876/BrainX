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
  | 'url'
  | 'select';

/** Fixed set of people roles; each becomes a section on the public People page. */
export const TEAM_ROLES = [
  'Principal Investigator',
  'Project Staff',
  'Research Scholar',
  'Masters Student',
  'Bachelors Students',
  'Alumni',
] as const;

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  help?: string;
  rows?: number;
  options?: { value: string; label: string }[];
  /** Must be filled in before the record can be saved. */
  required?: boolean;
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
    { key: 'name', label: 'Name', kind: 'text', placeholder: 'Full name', required: true },
    {
      key: 'role',
      label: 'Role',
      kind: 'select',
      required: true,
      placeholder: 'Select a role…',
      options: TEAM_ROLES.map((role) => ({ value: role, label: role })),
      help: 'Decides which section of the People page this person appears in.',
    },
    { key: 'position', label: 'Position', kind: 'text', placeholder: 'e.g. Assistant Professor, Dept. of CSE', required: true },
    {
      key: 'tagline',
      label: 'Short tag (shown on the People page photo)',
      kind: 'text',
      placeholder: 'e.g. JRF · Ph.D. Scholar',
      help: 'A few words shown under the name on the photo card. Leave empty to use the Position instead.',
    },
    { key: 'description', label: 'Description', kind: 'textarea', rows: 5, placeholder: 'Short biography' },
    { key: 'image', label: 'Photo', kind: 'image' },
    { key: 'link', label: 'Link', kind: 'url', placeholder: 'https://…' },
    { key: 'tags', label: 'Tags', kind: 'tags' },
  ],
  research: [
    { key: 'title', label: 'Title', kind: 'text', placeholder: 'Research area' },
    { key: 'description', label: 'Description', kind: 'textarea', rows: 4 },
    { key: 'image', label: 'Diagram / Image', kind: 'image' },
    { key: 'tags', label: 'Tags', kind: 'tags' },
  ],
  projects: [
    { key: 'title', label: 'Title', kind: 'text', placeholder: 'Project name' },
    {
      key: 'category',
      label: 'Category',
      kind: 'select',
      options: [
        { value: 'inhouse', label: 'In-house Project' },
        { value: 'students', label: 'Student Project' },
      ],
      help: 'Categorize whether this is an in-house lab project or student work.',
    },
    { key: 'description', label: 'Description', kind: 'textarea', rows: 4, placeholder: 'Brief description and explanation of the project' },
    {
      key: 'members',
      label: 'People Working on Project',
      kind: 'tags',
      placeholder: 'Type a person name and press Enter',
      help: 'Add each person working on this project (press Enter after each name).',
    },
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
    { key: 'name', label: 'Name', kind: 'text', placeholder: 'Event name (e.g. AI Day @ IIITDM 2026)' },
    { key: 'description', label: 'Description', kind: 'textarea', rows: 3, placeholder: 'Short event subtitle or description' },
    {
      key: 'tags',
      label: 'Tags',
      kind: 'tags',
      placeholder: 'e.g. EVENTS, CELEBRATIONS (press Enter)',
      help: 'Category badge displayed at the bottom of the event card.',
    },
    { key: 'date', label: 'Date', kind: 'date' },
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
export function createRecord(
  collection: Collection,
  initialOverrides?: Partial<RecordValue>,
): RecordValue {
  const id = newId();
  let base: RecordValue;
  switch (collection) {
    case 'publications':
      base = { id, title: '', authors: '', year: new Date().getFullYear(), venue: '', tags: [], link: '' };
      break;
    case 'team':
      base = { id, name: '', role: '', position: '', tagline: '', description: '', image: '', link: '', tags: [] };
      break;
    case 'research':
      base = { id, title: '', description: '', image: '', tags: [] };
      break;
    case 'projects':
      base = { id, title: '', category: 'inhouse', description: '', tags: [], image: '', images: [], members: [], link: '' };
      break;
    case 'news':
      base = { id, title: '', date: '', description: '', tags: [], link: '' };
      break;
    case 'events':
      base = { id, title: '', date: '', description: '', tags: [], link: '', image: '', time: '', venue: '' };
      break;
    case 'pictures':
      base = { id, name: '', date: '', description: '', thumbnail: '', images: [], tags: [] };
      break;
  }
  return initialOverrides ? { ...base, ...initialOverrides } : base;
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

  if (collection === 'publications') {
    // Reorder within the same year only (papers are grouped by year in the admin)
    const year = list[index].year;
    let target = -1;
    for (let i = index + direction; i >= 0 && i < list.length; i += direction) {
      if (list[i].year === year) {
        target = i;
        break;
      }
    }
    if (target < 0) return draft;
    [list[index], list[target]] = [list[target], list[index]];
    return { ...draft, [collection]: list } as Content;
  }

  if (collection === 'projects') {
    const curCat =
      list[index].category === 'students' || list[index].category === 'student'
        ? 'students'
        : 'inhouse';

    let target = -1;
    if (direction === -1) {
      for (let i = index - 1; i >= 0; i--) {
        const cat =
          list[i].category === 'students' || list[i].category === 'student'
            ? 'students'
            : 'inhouse';
        if (cat === curCat) {
          target = i;
          break;
        }
      }
    } else {
      for (let i = index + 1; i < list.length; i++) {
        const cat =
          list[i].category === 'students' || list[i].category === 'student'
            ? 'students'
            : 'inhouse';
        if (cat === curCat) {
          target = i;
          break;
        }
      }
    }

    if (target < 0) return draft;
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    return { ...draft, [collection]: list } as Content;
  }

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
