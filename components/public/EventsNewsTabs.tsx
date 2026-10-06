'use client';

import { useCallback } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays, Newspaper } from 'lucide-react';
import type { Event, News } from '@/lib/types';
import { cn } from '@/lib/utils';
import EmptyState from './EmptyState';
import EventAccordion from './EventAccordion';
import NewsList from './NewsList';

const TAB_EVENTS = 'events';
const TAB_NEWS = 'news';

function sortNews(news: News[]): News[] {
  return [...news].sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });
}

const triggerClass =
  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors data-[state=active]:bg-navy-700 data-[state=active]:text-paper hover:text-ink data-[state=active]:hover:text-paper';

/**
 * Events & News tabs. The active tab is driven by the `?tab=` query parameter so
 * links such as `/events?tab=news` are shareable. Requires a Suspense boundary
 * because it reads `useSearchParams`.
 */
export default function EventsNewsTabs({ events, news }: { events: Event[]; news: News[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const value = searchParams.get('tab') === TAB_NEWS ? TAB_NEWS : TAB_EVENTS;

  const onValueChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const sortedNews = sortNews(news);

  return (
    <Tabs.Root value={value} onValueChange={onValueChange}>
      <Tabs.List
        aria-label="Events and news"
        className="inline-flex items-center gap-1 rounded-full border border-rule bg-surface p-1"
      >
        <Tabs.Trigger value={TAB_EVENTS} className={cn(triggerClass)}>
          <CalendarDays className="h-4 w-4" aria-hidden />
          Events
          <span className="text-xs">({events.length})</span>
        </Tabs.Trigger>
        <Tabs.Trigger value={TAB_NEWS} className={cn(triggerClass)}>
          <Newspaper className="h-4 w-4" aria-hidden />
          News
          <span className="text-xs">({news.length})</span>
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value={TAB_EVENTS} className="mt-8 focus-visible:outline-none">
        {events.length > 0 ? (
          <EventAccordion events={events} />
        ) : (
          <EmptyState
            icon={<CalendarDays className="h-5 w-5" aria-hidden />}
            title="No events scheduled"
            message="Workshops, seminars and talks hosted by the lab will be listed here. Check back soon."
          />
        )}
      </Tabs.Content>

      <Tabs.Content value={TAB_NEWS} className="mt-8 focus-visible:outline-none">
        {sortedNews.length > 0 ? (
          <NewsList news={sortedNews} />
        ) : (
          <EmptyState
            icon={<Newspaper className="h-5 w-5" aria-hidden />}
            title="No news yet"
            message="Announcements, awards and updates from the lab will appear here. Nothing has been published so far."
          />
        )}
      </Tabs.Content>
    </Tabs.Root>
  );
}
