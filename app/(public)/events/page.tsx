import type { Metadata } from 'next';
import { Suspense } from 'react';
import EventsNewsTabs from '@/components/public/EventsNewsTabs';
import PageHeader from '@/components/public/PageHeader';
import { getContent } from '@/lib/content';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Events & News',
  description: 'Events, talks and news from BrainX Lab.',
};

function TabsFallback() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-11 w-64 rounded-full bg-rule/70" />
      <div className="h-40 w-full rounded-md bg-rule/40" />
    </div>
  );
}

export default function EventsPage() {
  const { events, news } = getContent();

  return (
    <>
      <PageHeader
        eyebrow="Events & News"
        title="Events & News"
        lead="Talks, workshops and announcements from the lab. Use the tabs to switch between upcoming events and news."
      />

      <div className="shell py-14">
        <Suspense fallback={<TabsFallback />}>
          <EventsNewsTabs events={events} news={news} />
        </Suspense>
      </div>
    </>
  );
}
