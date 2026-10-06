import { afterEach, expect, it, vi } from 'vitest';
import { getContent } from '../lib/content';
import { clearDraft, readDraft, writeDraft, DRAFT_STORAGE_KEY } from '../components/admin/lib/draft';

afterEach(() => vi.unstubAllGlobals());

it('persists and restores only valid complete drafts', () => {
  const values = new Map<string, string>();
  vi.stubGlobal('window', { sessionStorage: { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => values.set(k, v), removeItem: (k: string) => values.delete(k) } });
  expect(writeDraft({ content: getContent(), baseSha: 'abc', savedAt: 1 })).toBe(true);
  expect(readDraft()?.baseSha).toBe('abc');
  values.set(DRAFT_STORAGE_KEY, JSON.stringify({ version: 1, baseSha: 'abc', savedAt: 1, content: {} }));
  expect(readDraft()).toBeNull();
  clearDraft();
  expect(values.size).toBe(0);
});

it('reports denied browser storage without crashing the editor', () => {
  vi.stubGlobal('window', { sessionStorage: { getItem: () => { throw Error('Denied'); }, setItem: () => { throw Error('Quota'); }, removeItem: () => { throw Error('Denied'); } } });
  expect(readDraft()).toBeNull();
  expect(writeDraft({ content: getContent(), baseSha: 'abc', savedAt: 1 })).toBe(false);
  expect(() => clearDraft()).not.toThrow();
});
