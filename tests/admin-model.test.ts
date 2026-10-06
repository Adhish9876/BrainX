import { describe, expect, it } from 'vitest';
import { getContent } from '../lib/content';
import { validateContent } from '../lib/validation';
import { addRecord, createRecord, moveRecord, removeRecord, replaceRecord, updateSite, COLLECTIONS } from '../components/admin/lib/content';
import { diffContent } from '../components/admin/lib/diff';

describe('browser-side CMS model', () => {
  for (const collection of COLLECTIONS) {
    it(`adds, edits, reorders and removes ${collection} without mutating the baseline`, () => {
      const baseline = getContent();
      const before = JSON.stringify(baseline);
      const record = createRecord(collection);
      const second = createRecord(collection);
      const initialCount = baseline[collection].length;
      let draft = addRecord(addRecord(baseline, collection, record), collection, second);
      expect(draft[collection]).toHaveLength(initialCount + 2);
      expect(validateContent(draft).ok).toBe(true);
      draft = replaceRecord(draft, collection, String(record.id), { ...record, description: 'Edited' });
      // Description is not a publication field; keep this open-form test within its contract.
      if (collection === 'publications') draft = replaceRecord(draft, collection, String(record.id), { ...record, title: 'Edited' });
      draft = moveRecord(draft, collection, String(second.id), -1);
      expect(draft[collection][initialCount].id).toBe(second.id);
      draft = removeRecord(removeRecord(draft, collection, String(record.id)), collection, String(second.id));
      expect(diffContent(baseline, draft)).toEqual([]);
      expect(JSON.stringify(baseline)).toBe(before);
    });
  }

  it('counts changed records rather than keystrokes and identifies reordering', () => {
    const baseline = getContent();
    let draft = updateSite(baseline, { tagline: 'a' });
    draft = updateSite(draft, { tagline: 'abc' });
    expect(diffContent(baseline, draft)).toHaveLength(1);
    if (baseline.publications.length > 1) {
      const reordered = moveRecord(baseline, 'publications', baseline.publications[0].id, 1);
      expect(diffContent(baseline, reordered)).toEqual([{ kind: 'reorder', collection: 'publications', label: 'publications' }]);
    }
  });
});
