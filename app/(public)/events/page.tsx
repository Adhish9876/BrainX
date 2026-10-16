import type { Metadata } from 'next';
import { Suspense } from 'react';
import Reveal from '@/components/home/Reveal';
import EventsNewsTabs from '@/components/public/EventsNewsTabs';
import { getContent } from '@/lib/content';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Events & News',
  description: 'Events, talks and news from BrainX Lab.',
};

function TabsFallback() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      <div className="h-12 w-56 rounded-full bg-slate-100" />
      <div className="h-64 w-full rounded-[2rem] bg-slate-100" />
    </div>
  );
}

export default function EventsPage() {
  const { events, news } = getContent();

  return (
    <div className="relative isolate bg-white">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate -mt-22 overflow-hidden pt-22 md:-mt-24 md:pt-24">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/event_bg.png"
            alt=""
            draggable={false}
            className="h-full w-full object-cover object-left opacity-55 saturate-[0.8]"
          />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent" />
        </div>

        <div className="shell pb-12 pt-8 sm:pb-14 sm:pt-12 md:pb-16 md:pt-14">
          <Reveal>
            <h1 className="max-w-4xl font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-[#1d1d1f] sm:text-6xl lg:text-7xl">
              What&apos;s happening at BrainX.
            </h1>
          </Reveal>
        </div>
      </section>

      <div className="shell pb-24 md:pb-28">
        <Suspense fallback={<TabsFallback />}>
          <EventsNewsTabs events={events} news={news} />
        </Suspense>
      </div>
    </div>
  );
}
