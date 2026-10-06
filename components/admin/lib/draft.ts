import type { Content } from '@/lib/types';

/**
 * Drafts live in sessionStorage, so they are scoped to the browser tab and
 * vanish when the tab closes. The session endpoint only reports whether the
 * visitor is authenticated (no user id), so a single well-known key is used
 * for the signed-in admin session. Drafts are cleared explicitly on sign-out
 * and after a successful publish.
 */
export const DRAFT_STORAGE_KEY = 'brainx.admin.draft.v1';

export interface StoredDraft {
  version: 1;
  baseSha: string;
  content: Content;
  savedAt: number;
}

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function isStoredDraft(value: unknown): value is StoredDraft {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 1 &&
    typeof record.baseSha === 'string' &&
    typeof record.savedAt === 'number' &&
    !!record.content &&
    typeof record.content === 'object'
  );
}

export function readDraft(): StoredDraft | null {
  const store = storage();
  if (!store) return null;
  const raw = store.getItem(DRAFT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isStoredDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeDraft(draft: Omit<StoredDraft, 'version'>): void {
  const store = storage();
  if (!store) return;
  const payload: StoredDraft = { version: 1, ...draft };
  try {
    store.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota or serialization failures must not break editing; the draft simply
    // is not persisted.
  }
}

export function clearDraft(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
