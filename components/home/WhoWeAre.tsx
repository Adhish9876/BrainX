'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Article,
  Megaphone,
} from '@phosphor-icons/react';
import { useInView } from 'motion/react';
import Counter from '@/components/ui/Counter';
import type { Member, Site, News, Event, Publication } from '@/lib/types';
import Reveal from './Reveal';

type Props = {
  site: Site;
  principal?: Member;
  areas: string[];
  news: News[];
  events: Event[];
  publications?: Publication[];
};

function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function WhoWeAre({
  site,
  principal,
  news = [],
  events = [],
  publications = [],
}: Props) {
  const [activeTab, setActiveTab] = useState<'news' | 'research'>('news');
  const grantRef = useRef<HTMLDivElement>(null);
  const isGrantInView = useInView(grantRef, { once: true, margin: '-20px' });

  // Combined news and announcements
  const allUpdates = [
    ...events.map((e) => ({
      id: e.id,
      category: 'Event' as const,
      badge: 'Event',
      title: e.title,
      meta: formatShortDate(e.date) + (e.venue ? ` · ${e.venue}` : ''),
      detail: e.description,
      href: e.link || '/events',
      external: Boolean(e.link && e.link.startsWith('http')),
    })),
    ...news.map((n) => ({
      id: n.id,
      category: 'Update' as const,
      badge: n.tags?.[0] || 'Update',
      title: n.title,
      meta: formatShortDate(n.date),
      detail: n.description,
      href: n.link || '/events?tab=news',
      external: Boolean(n.link && n.link.startsWith('http')),
    })),
  ].slice(0, 4);

  // Recent high-impact publications
  const recentResearch = [...publications]
    .sort((a, b) => b.year - a.year)
    .slice(0, 4)
    .map((p) => ({
      id: p.id,
      category: 'Paper' as const,
      badge: p.tags?.[0] || 'Paper',
      title: p.title,
      meta: `${p.year} · ${p.venue}`,
      detail: p.authors,
      href: p.link || '/publications',
      external: Boolean(p.link && p.link.startsWith('http')),
    }));

  return (
    <section
      id="who-we-are"
      aria-labelledby="who-heading"
      className="relative isolate overflow-hidden min-h-[calc(100svh-var(--header-h))] bg-paper pt-8 pb-12 md:pt-10 md:pb-14 border-t border-ink/8"
    >
      {/* Left decorative contour background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/leftbg.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none select-none absolute -left-28 top-0 -z-10 h-full w-auto max-w-[70vw] object-cover object-left mix-blend-multiply opacity-90 sm:-left-36 lg:-left-48"
      />

      <div className="shell">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16 xl:gap-24">
          
          {/* LEFT COLUMN: Minimalist, high-readability overview */}
          <div className="lg:col-span-7 xl:col-span-7">
            <Reveal>
              <h2
                id="who-heading"
                className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-[2.5rem] leading-[1.16]"
              >
                Pioneering brain–computer interfaces and neural engineering.
              </h2>
            </Reveal>

            <Reveal delay={0.06}>
              <p className="mt-5 text-base sm:text-lg leading-relaxed text-ink/80 max-w-xl">
                Led by {principal?.name ?? 'Dr. Kannadasan K'} at {site.institution}, <strong className="font-semibold text-ink">BrainX Lab</strong> develops non-invasive neural decoders and closed-loop biosignal interfaces for cognitive enhancement, affective computing, and assistive communication.
              </p>
            </Reveal>

            {/* MINIMALIST RESEARCH ENDOWMENT METRIC */}
            <Reveal delay={0.12}>
              <div
                ref={grantRef}
                className="mt-7 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border-l-2 border-crimson-600 pl-4 py-0.5"
              >
                <div className="flex items-baseline font-mono text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                  <span className="text-crimson-600 mr-1 select-none">₹</span>
                  <Counter
                    value={isGrantInView ? 15000000 : 0}
                    places={[10000000, ',', 1000000, 100000, ',', 10000, 1000, ',', 100, 10, 1, '+']}
                    fontSize={28}
                    padding={2}
                    gap={0.5}
                    textColor="var(--color-ink)"
                    fontWeight={700}
                    gradientHeight={0}
                  />
                </div>
                <div className="text-xs text-muted leading-tight">
                  <div className="font-semibold text-ink">ANRF PMECRG Grant (2025–2028)</div>
                  <div className="text-[0.72rem] text-muted mt-0.5">
                    Anusandhan National Research Foundation · PM Early Career Research Grant
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.16}>
              <div className="mt-8 max-w-md sm:max-w-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/fact.png"
                  alt="BrainX Lab core pillars: Human-Computer Interaction, Neuroscience, and Artificial Intelligence"
                  className="h-auto w-full object-contain mix-blend-multiply select-none"
                  draggable={false}
                />
              </div>
            </Reveal>
          </div>

          {/* RIGHT COLUMN: Professional News + Research Feed (pushed to the right) */}
          <div className="lg:col-span-5 xl:col-span-5 lg:ml-auto w-full max-w-lg lg:max-w-none">
            <Reveal delay={0.12}>
              <div className="flex flex-col rounded-2xl border border-ink/15 bg-surface shadow-xs min-h-[560px] lg:min-h-[620px] overflow-hidden">
                
                {/* Segmented Header: Switch between News and Research */}
                <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4 bg-paper/60">
                  <div className="flex items-center gap-1 rounded-lg border border-ink/10 bg-paper/90 p-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('news')}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 font-sans text-xs font-medium tracking-normal transition-all ${
                        activeTab === 'news'
                          ? 'bg-ink text-white shadow-xs'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      <Megaphone weight={activeTab === 'news' ? 'fill' : 'regular'} className="h-3.5 w-3.5" />
                      <span>News & Updates</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('research')}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 font-sans text-xs font-medium tracking-normal transition-all ${
                        activeTab === 'research'
                          ? 'bg-ink text-white shadow-xs'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      <Article weight={activeTab === 'research' ? 'fill' : 'regular'} className="h-3.5 w-3.5" />
                      <span>Publications</span>
                    </button>
                  </div>

                  <Link
                    href={activeTab === 'news' ? '/events' : '/publications'}
                    className="group inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink transition-colors"
                  >
                    <span>View all</span>
                    <ArrowUpRight
                      weight="bold"
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </Link>
                </div>

                {/* Content Stream with generous vertical breathing room */}
                <div className="flex flex-1 flex-col justify-between divide-y divide-ink/8 px-6 py-2">
                  {activeTab === 'news' ? (
                    allUpdates.length > 0 ? (
                      allUpdates.map((item) => {
                        const ItemTag = item.external ? 'a' : Link;
                        const props = item.external
                          ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' }
                          : { href: item.href };

                        return (
                          <article key={item.id} className="group py-5 transition-colors">
                            <ItemTag {...(props as any)} className="block">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="inline-block rounded-md bg-crimson-500/10 px-2 py-0.5 font-mono text-[0.65rem] font-medium uppercase tracking-wider text-crimson-700">
                                    {item.badge}
                                  </span>
                                  <span className="text-xs font-medium text-muted">
                                    {item.meta}
                                  </span>
                                </div>
                                <ArrowUpRight
                                  weight="bold"
                                  className="h-3.5 w-3.5 text-ink/20 transition-all duration-150 group-hover:text-ink group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                />
                              </div>
                              <p className="mt-2 text-[0.95rem] font-sans font-semibold leading-snug tracking-normal text-ink transition-colors group-hover:text-navy-700">
                                {item.title}
                              </p>
                              {item.detail && (
                                <p className="mt-1.5 text-xs font-sans leading-relaxed text-muted line-clamp-2">
                                  {item.detail}
                                </p>
                              )}
                            </ItemTag>
                          </article>
                        );
                      })
                    ) : (
                      <p className="py-12 text-center text-xs font-sans text-muted">
                        No recent announcements.
                      </p>
                    )
                  ) : (
                    recentResearch.length > 0 ? (
                      recentResearch.map((item) => {
                        const ItemTag = item.external ? 'a' : Link;
                        const props = item.external
                          ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' }
                          : { href: item.href };

                        return (
                          <article key={item.id} className="group py-5 transition-colors">
                            <ItemTag {...(props as any)} className="block">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="inline-block rounded-md bg-navy-500/10 px-2 py-0.5 font-mono text-[0.65rem] font-medium uppercase tracking-wider text-navy-700">
                                    {item.badge}
                                  </span>
                                  <span className="text-xs font-sans font-medium text-navy-700 truncate">
                                    {item.meta}
                                  </span>
                                </div>
                                <ArrowUpRight
                                  weight="bold"
                                  className="h-3.5 w-3.5 shrink-0 text-ink/20 transition-all duration-150 group-hover:text-ink group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                />
                              </div>
                              <p className="mt-2 text-[0.95rem] font-sans font-semibold leading-snug tracking-normal text-ink transition-colors group-hover:text-navy-700 line-clamp-2">
                                {item.title}
                              </p>
                              {item.detail && (
                                <p className="mt-1.5 text-xs font-sans leading-relaxed text-muted truncate">
                                  {item.detail}
                                </p>
                              )}
                            </ItemTag>
                          </article>
                        );
                      })
                    ) : (
                      <p className="py-12 text-center text-xs text-muted">
                        No publications listed.
                      </p>
                    )
                  )}
                </div>

                {/* Card Footer */}
                <div className="border-t border-ink/8 bg-paper/40 px-6 py-3.5 text-right">
                  <Link
                    href={activeTab === 'news' ? '/events' : '/publications'}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink transition-colors"
                  >
                    <span>
                      {activeTab === 'news' ? 'All Events & News' : 'Complete Publication List'}
                    </span>
                    <span>→</span>
                  </Link>
                </div>

              </div>
            </Reveal>
          </div>

        </div>
      </div>
    </section>
  );
}
