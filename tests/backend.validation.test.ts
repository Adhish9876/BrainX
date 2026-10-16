import { describe, expect, it } from 'vitest';
import { isGalleryImageUrl, isSafeId, isSafeUrl, isValidCalendarDate, validateContent } from '../lib/validation';
import { getContent } from '../lib/content';
import type { Content } from '../lib/types';

function makeContent(): Content {
  return {
    site: {
      name: 'BrainX Lab',
      institution: 'IIITDM Kancheepuram',
      tagline: '',
      about: '',
      focus: '',
      email: '',
      phone: '',
      address: '',
      logo: '/logo.svg',
    },
    publications: [],
    team: [],
    research: [],
    projects: [],
    news: [],
    events: [],
    pictures: [],
  };
}

const STAGED = `/api/admin/uploads/${'a'.repeat(32)}`;

describe('safe helpers', () => {
  it('validates safe ids', () => {
    expect(isSafeId('demo-gallery')).toBe(true);
    expect(isSafeId('a.b_c-1')).toBe(true);
    expect(isSafeId('bad id')).toBe(false);
    expect(isSafeId('../etc')).toBe(false);
    expect(isSafeId('')).toBe(false);
  });

  it('accepts same-site assets, media, staged uploads and http(s) links', () => {
    expect(isSafeUrl('/logo.svg')).toBe(true);
    expect(isSafeUrl('/media/pictures/g1/a.webp')).toBe(true);
    expect(isSafeUrl(STAGED)).toBe(true);
    expect(isSafeUrl('https://example.com/x')).toBe(true);
    expect(isSafeUrl('mailto:a@b.c')).toBe(true);
    expect(isSafeUrl('')).toBe(true);
  });

  it('rejects dangerous or malformed urls', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('data:text/html,x')).toBe(false);
    expect(isSafeUrl('//evil.example/x')).toBe(false);
    expect(isSafeUrl('/media/../secret')).toBe(false);
    expect(isSafeUrl('www.linkedin.com/in/x')).toBe(false);
  });

  it('validates calendar dates and years', () => {
    expect(isValidCalendarDate('')).toBe(true);
    expect(isValidCalendarDate('2025')).toBe(true);
    expect(isValidCalendarDate('2024-02-29')).toBe(true);
    expect(isValidCalendarDate('2025-02-30')).toBe(false);
    expect(isValidCalendarDate('2025-13-01')).toBe(false);
    expect(isValidCalendarDate('nope')).toBe(false);
  });

  it('scopes gallery images to their group', () => {
    expect(isGalleryImageUrl('/media/pictures/g1/a.webp', 'g1')).toBe(true);
    expect(isGalleryImageUrl('/media/pictures/g2/a.webp', 'g1')).toBe(false);
    expect(isGalleryImageUrl('https://evil.example/a.webp', 'g1')).toBe(false);
    expect(isGalleryImageUrl(STAGED, 'g1')).toBe(true);
  });
});

describe('validateContent', () => {
  it('accepts a minimal valid document and the current source data', () => {
    expect(validateContent(makeContent()).ok).toBe(true);
    expect(validateContent(getContent()).ok).toBe(true);
  });

  it('rejects unsafe ids, urls and dates', () => {
    const badId = makeContent();
    badId.pictures = [{ id: 'bad id', name: 'x', date: '', description: '', thumbnail: '', images: [] }];
    expect(validateContent(badId).ok).toBe(false);

    const badUrl = makeContent();
    badUrl.site.logo = 'javascript:alert(1)';
    expect(validateContent(badUrl).ok).toBe(false);

    const badDate = makeContent();
    badDate.news = [{ id: 'n1', title: 't', date: '2025-02-30', description: '', tags: [], link: '' }];
    expect(validateContent(badDate).ok).toBe(false);
  });

  it('accepts arbitrary tags without count or length restrictions', () => {
    const content = makeContent();
    content.research = [{ id: 'r1', title: 't', description: '', tags: ['Weird Tag #1', 'Ω-notation'] }];
    expect(validateContent(content).ok).toBe(true);

    const tooMany = makeContent();
    tooMany.research = [
      { id: 'r1', title: 't', description: '', tags: Array.from({ length: 31 }, (_, i) => `t${i}`) },
    ];
    expect(validateContent(tooMany).ok).toBe(true);

    const tooLong = makeContent();
    tooLong.research = [{ id: 'r1', title: 't', description: '', tags: ['x'.repeat(49)] }];
    expect(validateContent(tooLong).ok).toBe(true);
  });

  it('enforces the exact shared types (News has no image)', () => {
    const content = makeContent();
    content.news = [
      { id: 'n1', title: 't', date: '', description: '', tags: [], link: '', image: '/media/x.webp' } as never,
    ];
    expect(validateContent(content).ok).toBe(false);
  });

  it('bounds publication years', () => {
    const ok = makeContent();
    ok.publications = [{ id: 'p1', title: 't', authors: 'a', year: 2026, venue: 'v', tags: [], link: '' }];
    expect(validateContent(ok).ok).toBe(true);

    const bad = makeContent();
    bad.publications = [{ id: 'p1', title: 't', authors: 'a', year: 1800, venue: 'v', tags: [], link: '' }];
    expect(validateContent(bad).ok).toBe(false);
  });

  it('rejects external gallery images and duplicate ids', () => {
    const external = makeContent();
    external.pictures = [
      { id: 'g1', name: 'g', date: '', description: '', thumbnail: '', images: ['https://evil.example/a.webp'] },
    ];
    expect(validateContent(external).ok).toBe(false);

    const dupes = makeContent();
    dupes.pictures = [
      { id: 'g1', name: 'g', date: '', description: '', thumbnail: '', images: [] },
      { id: 'g1', name: 'g2', date: '', description: '', thumbnail: '', images: [] },
    ];
    expect(validateContent(dupes).ok).toBe(false);

    const dupesTeam = makeContent();
    const member = { id: 'm1', name: 'n', role: 'r', position: 'p', description: '', image: '', link: '', tags: [] };
    dupesTeam.team = [member, { ...member }];
    expect(validateContent(dupesTeam).ok).toBe(false);
  });
});

import { validateContent as validateContentForHome } from '../lib/validation';

describe('home settings in validation', () => {
  it('accepts grant amount, partners, team short tag and publication photo', async () => {
    const { getContent } = await import('../lib/content');
    const content = structuredClone(getContent());
    content.site.grantAmount = 1234;
    content.site.partners = [{ name: 'A', logo: '/partner-axxonet-logo.png', product: '', productName: '', description: '', link: '' }];
    if (content.team[0]) content.team[0].tagline = 'PI';
    if (content.publications[0]) content.publications[0].image = '/media/uploads/x.webp';
    const ok = validateContentForHome(content);
    expect(ok.ok).toBe(true);
    content.site.grantAmount = -5;
    expect(validateContentForHome(content).ok).toBe(false);
  });
});
