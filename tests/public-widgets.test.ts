import { expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ProjectCard from '../components/public/ProjectCard';
import EventCarousel from '../components/public/EventCarousel';
import type { Event } from '../lib/types';

it('renders the project image, arbitrary tags and real project link', () => {
  const html = renderToStaticMarkup(createElement(ProjectCard, { project: { id: 'p', title: 'Example project', description: 'Description', image: '/media/uploads/photo.webp', tags: ['Anything, 任意'], link: 'https://example.com/project' } }));
  expect(html).toContain('src="/media/uploads/photo.webp"');
  expect(html).toContain('href="https://example.com/project"');
  expect(html).toContain('View project');
  expect(html).toContain('Anything, 任意');
});

it('lists events newest first in the carousel with image, details and description', () => {
  const event = (id: string, date: string): Event => ({ id, title: id, date, time: '10 AM (text)', venue: 'Example venue', description: 'Example description', tags: ['Free form'], link: 'https://example.com/event', image: '/media/uploads/event.webp' });
  const html = renderToStaticMarkup(createElement(EventCarousel, { events: [event('Older fixture', '2025-01-01'), event('Latest fixture', '2026-01-01')] }));
  expect(html.indexOf('Latest fixture')).toBeLessThan(html.indexOf('Older fixture'));
  for (const text of ['Latest', 'src="/media/uploads/event.webp"', '10 AM (text)', 'Example venue', 'Example description', 'More info']) expect(html).toContain(text);
});
