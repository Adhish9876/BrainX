import type { Content } from '@/lib/types';

export type { Content };

/** A single record as an open key/value bag while it is being edited. */
export type RecordValue = Record<string, unknown>;

export type Collection = Exclude<keyof Content, 'site'>;

export const COLLECTIONS: Collection[] = [
  'publications',
  'team',
  'research',
  'projects',
  'events',
  'news',
  'pictures',
];

export const COLLECTION_LABELS: Record<Collection, string> = {
  publications: 'Publications',
  team: 'Team',
  research: 'Research',
  projects: 'Projects',
  events: 'Events',
  news: 'News',
  pictures: 'Pictures',
};

export const COLLECTION_SINGULAR: Record<Collection, string> = {
  publications: 'Publication',
  team: 'Team member',
  research: 'Research area',
  projects: 'Project',
  events: 'Event',
  news: 'News item',
  pictures: 'Picture group',
};
