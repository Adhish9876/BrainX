import type { Content, Site } from '@/lib/types';

import { COLLECTIONS, type Collection, type RecordValue } from './content-types';
import { recordLabel } from './content';

export type Change =
  | { kind: 'site'; field: keyof Site; label: string }
  | { kind: 'add'; collection: Collection; id: string; label: string }
  | { kind: 'remove'; collection: Collection; id: string; label: string }
  | { kind: 'update'; collection: Collection; id: string; label: string }
  | { kind: 'reorder'; collection: Collection; label: string };

const SITE_FIELD_LABELS: Record<keyof Site, string> = {
  name: 'Name',
  institution: 'Institution',
  tagline: 'Tagline',
  about: 'About',
  focus: 'Focus',
  email: 'Email',
  phone: 'Phone',
  address: 'Address',
  logo: 'Logo',
};

function stable(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stable(record[k])}`).join(',')}}`;
}

function equal(a: unknown, b: unknown): boolean {
  return stable(a) === stable(b);
}

function withoutId(record: RecordValue): RecordValue {
  const { id: _id, ...rest } = record;
  return rest;
}

/**
 * Compare the committed content with the working draft and describe every
 * changed item. The result is intentionally item-oriented (not keystroke
 * oriented) so the status bar can report a meaningful count.
 */
export function diffContent(remote: Content, draft: Content): Change[] {
  const changes: Change[] = [];

  for (const field of Object.keys(SITE_FIELD_LABELS) as (keyof Site)[]) {
    if (!equal(remote.site?.[field], draft.site?.[field])) {
      changes.push({ kind: 'site', field, label: SITE_FIELD_LABELS[field] });
    }
  }

  for (const collection of COLLECTIONS) {
    const remoteList = (remote[collection] ?? []) as unknown as RecordValue[];
    const draftList = (draft[collection] ?? []) as unknown as RecordValue[];

    const remoteById = new Map<string, RecordValue>();
    for (const item of remoteList) remoteById.set(String(item.id), item);
    const draftById = new Map<string, RecordValue>();
    for (const item of draftList) draftById.set(String(item.id), item);

    for (const item of draftList) {
      const id = String(item.id);
      const existing = remoteById.get(id);
      if (!existing) {
        changes.push({
          kind: 'add',
          collection,
          id,
          label: recordLabel(collection, item),
        });
      } else if (!equal(withoutId(existing), withoutId(item))) {
        changes.push({
          kind: 'update',
          collection,
          id,
          label: recordLabel(collection, item),
        });
      }
    }

    for (const item of remoteList) {
      const id = String(item.id);
      if (!draftById.has(id)) {
        changes.push({
          kind: 'remove',
          collection,
          id,
          label: recordLabel(collection, item),
        });
      }
    }

    const remoteOrder = remoteList.map((item) => String(item.id));
    const draftOrder = draftList.map((item) => String(item.id));
    const sameSet =
      remoteOrder.length === draftOrder.length &&
      remoteOrder.every((id) => draftById.has(id));
    if (sameSet && remoteOrder.join('\u0000') !== draftOrder.join('\u0000')) {
      changes.push({
        kind: 'reorder',
        collection,
        label: collection,
      });
    }
  }

  return changes;
}
