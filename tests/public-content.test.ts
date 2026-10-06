import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { getContent, groupPublicationsByYear, groupTeamByRole } from '../lib/content';

describe('compile-time content model', () => {
  it('loads the content contract without a runtime network dependency', () => {
    const data = getContent();
    expect(typeof data.site.name).toBe('string');
    for (const key of ['publications', 'team', 'research', 'projects', 'news', 'events', 'pictures'] as const) expect(Array.isArray(data[key])).toBe(true);
  });

  it('groups publications newest first while preserving record order within a year', () => {
    const records = [2024, 2026, 2025, 2025].map((year, i) => ({ id: String(i), year, title: 'Example', authors: 'A', venue: 'V', tags: [], link: '' }));
    const groups = groupPublicationsByYear(records);
    expect(groups.map(g => g.year)).toEqual([2026, 2025, 2024]);
    expect(groups.find(g => g.year === 2025)?.items.map(p => p.id)).toEqual(records.filter(p => p.year === 2025).map(p => p.id));
  });

  it('preserves team role order and compiles gallery directories to real build assets', () => {
    const data = getContent();
    expect(groupTeamByRole(data.team).flatMap(g => g.members)).toHaveLength(data.team.length);
    for (const group of data.pictures) {
      if (group.images.length) expect(group.images).toContain(group.thumbnail);
      for (const image of group.images) expect(existsSync('public' + image)).toBe(true);
    }
  });
});
