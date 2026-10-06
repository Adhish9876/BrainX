import { expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LatestRail from '../components/public/LatestRail';
import NewsList from '../components/public/NewsList';
import type { News } from '../lib/types';

it('limits the homepage to the latest 10 news and links to the full news tab', () => {
  const news: News[] = Array.from({ length: 11 }, (_, i) => ({ id: String(i), title: `QA-news-${String(i + 1).padStart(2, '0')}`, date: `2026-10-${String(i + 1).padStart(2, '0')}`, description: '', link: '', tags: ['任意 / custom'] }));
  const html = renderToStaticMarkup(createElement(LatestRail, { news, publications: [] }));
  expect(html).toContain('QA-news-11');
  expect(html).not.toContain('QA-news-01');
  expect(html.match(/QA-news-\d+/g)).toHaveLength(10);
  expect(html).toContain('/events?tab=news');
  const all = renderToStaticMarkup(createElement(NewsList, { news }));
  expect(all.match(/QA-news-\d+/g)).toHaveLength(11);
});
