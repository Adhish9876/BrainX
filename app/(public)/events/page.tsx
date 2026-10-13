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
    <div className="relative isolate bg-white">
      <div className="relative isolate -mt-22 overflow-hidden bg-white pt-22 md:-mt-24 md:pt-24">
        {/* Top decorative contour background flowing from the navbar and confined strictly to the header div */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-0 -z-10 overflow-hidden"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/leftbg.png"
            alt=""
            draggable={false}
            className="absolute left-[46%] -top-[680px] w-[1200px] max-w-none -translate-x-1/2 rotate-90 mix-blend-multiply opacity-90 sm:-top-[860px] sm:w-[1500px] lg:-top-[1040px] lg:w-[1800px]"
          />
        </div>

        <PageHeader
          title="Events & News"
          lead="Talks, workshops and announcements from the lab. Use the tabs to switch between upcoming events and news."
          className="bg-transparent"
        />
      </div>

      <div className="shell py-8 md:py-10">
        <Suspense fallback={<TabsFallback />}>
          <EventsNewsTabs events={events} news={news} />
        </Suspense>
      </div>
    </div>
  );
}
