'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Article,
  Megaphone,
} from '@phosphor-icons/react';
import { motion, useInView, useScroll, useTransform, useMotionValueEvent } from 'motion/react';
import Counter from '@/components/ui/Counter';
import type { Member, Site, News, Event, Publication } from '@/lib/types';
import Reveal from './Reveal';
import EventsImageCarousel from './EventsImageCarousel';

type Props = {
  site: Site;
  principal?: Member;
  areas: string[];
  news: News[];
  events: Event[];
  publications?: Publication[];
  stats?: { label: string; value: number; prefix?: string; suffix?: string; places?: (number | string)[] }[];
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

function getBadgeClasses(badge: string): string {
  const key = badge.trim().toLowerCase();
  if (key.includes('journal')) {
    return 'bg-navy-700 text-white';
  }
  if (key.includes('grant')) {
    return 'bg-crimson-600 text-white';
  }
  if (key.includes('publication') || key.includes('paper')) {
    return 'bg-ink text-white';
  }
  if (key.includes('conference')) {
    return 'bg-gold text-white';
  }
  if (key.includes('event') || key.includes('workshop')) {
    return 'bg-teal-700 text-white';
  }
  return 'bg-navy-800 text-white';
}

const pullUp = {
  hidden: {
    y: 110,
    transition: {
      duration: 1.4,
      ease: [0.12, 1, 0.2, 1] as const,
    },
  },
  visible: {
    y: 0,
    transition: {
      duration: 2.8,
      ease: [0.12, 1, 0.2, 1] as const,
    },
  },
};








export default function WhoWeAre({
  site,
  principal,
  news = [],
  events = [],
  publications = [],
  stats = [],
}: Props) {
  const [activeTab, setActiveTab] = useState<'news' | 'research'>('news');
  const [hasScrolled, setHasScrolled] = useState(false);
  const { scrollY } = useScroll();

  // After a reload / back navigation the browser restores the scroll position without a scroll event,
  // so reveal immediately instead of leaving the section parked below its place.
  useEffect(() => {
    if (window.scrollY > 50) setHasScrolled(true);
    // Hand control back to the animation once the section is in its final place
    const t = window.setTimeout(() => document.documentElement.classList.remove('bx-restored'), 150);
    return () => window.clearTimeout(t);
  }, []);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    // Crosses threshold at 50px of scroll: triggers the animation immediately.
    // If user scrolls back up above 40px, it immediately reverses.
    if (latest > 50 && !hasScrolled) {
      setHasScrolled(true);
    } else if (latest <= 40 && hasScrolled) {
      setHasScrolled(false);
    }
  });

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
      className="relative isolate overflow-hidden min-h-[calc(100svh-var(--header-h))] bg-[#f5f5f7] pt-5 sm:pt-6 md:pt-7 pb-16 md:pb-24 border-t border-[#e0e0e0]"
    >
      {/* Subtle organic contour texture softly blended into parchment canvas */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/publications_bg.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none select-none absolute inset-0 -z-10 h-full w-full object-cover object-left opacity-90"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-1/3 -z-10 h-96 w-96 rounded-full bg-orange-200/40 blur-3xl"
      />

      <motion.div
        initial="hidden"
        animate={hasScrolled ? 'visible' : 'hidden'}
        variants={pullUp}
        className="w-full px-5 sm:px-8 md:px-12 lg:pl-[max(3rem,calc((100vw-76rem)/2))] lg:pr-8 xl:pr-14 2xl:pr-18 will-change-transform"
      >
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-14 xl:gap-20">
          
          {/* LEFT COLUMN: Apple Typography & Research Mission */}
          <div className="lg:col-span-7 xl:col-span-7 pt-0">
            <div>
              <h2
                id="who-heading"
                className="font-display text-[2.1rem] sm:text-[2.7rem] lg:text-[3.2rem] font-semibold tracking-[-0.035em] text-[#1d1d1f] leading-[1.08]"
              >
                Pioneering brain–computer interfaces and neural engineering.
              </h2>
            </div>

            <div>
              <p className="mt-4 text-[1.05rem] sm:text-[1.12rem] lg:text-[1.18rem] font-sans font-normal leading-[1.55] tracking-[-0.015em] text-[#333333] max-w-xl">
                Led by {principal?.name ?? 'Dr. Kannadasan K'} at {site.institution},{' '}
                <strong className="font-semibold text-[#1d1d1f]">BrainX Lab</strong> develops
                non-invasive neural decoders and closed-loop biosignal interfaces for
                cognitive enhancement, affective computing, and assistive communication.
              </p>
            </div>

            <div className="mt-6">
              <EventsImageCarousel events={events} />
            </div>

            {stats.length > 0 ? (
              <dl className="mt-4 flex max-w-xl flex-wrap gap-x-12 gap-y-4 border-t border-slate-300/70 pt-4">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <dt className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {stat.label}
                    </dt>
                    <dd className="mt-1 flex items-center font-display text-4xl font-extrabold tracking-tight text-[#1d1d1f]">
                      {stat.prefix ? <span>{stat.prefix}</span> : null}
                      <Counter
                        value={stat.value}
                        places={stat.places}
                        fontSize={36}
                        gap={0}
                        horizontalPadding={0}
                        borderRadius={0}
                        gradientHeight={0}
                        fontWeight={800}
                        textColor="#1d1d1f"
                      />
                      {stat.suffix ? <span>{stat.suffix}</span> : null}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>

          {/* RIGHT COLUMN: Apple Store Utility Card News & Publications Feed */}
          <div className="lg:col-span-5 xl:col-span-5 lg:ml-auto w-full max-w-md lg:max-w-[27.5rem] xl:max-w-[29rem]">

            <div className="relative">
            <div className="relative flex flex-col rounded-[22px] border border-white/90 bg-[linear-gradient(180deg,#e9ebf0_0%,#f1f2f6_100%)] shadow-[inset_0_3px_8px_rgba(11,16,32,0.16),inset_0_1px_2px_rgba(11,16,32,0.12),inset_0_-1px_0_rgba(255,255,255,0.9),0_1px_0_rgba(255,255,255,0.95)] min-h-[580px] lg:min-h-[630px] overflow-hidden">
                
                {/* Apple Frosted Sub-header with Capsule Pill Switcher */}
                <div className="flex items-center justify-between border-b border-[#dcdee4] px-5 py-3.5 bg-transparent shadow-[0_1px_0_rgba(255,255,255,0.8)] relative z-10">
                  <div className="flex items-center gap-1.5 rounded-full bg-[#e9e9ee] p-1 shadow-[inset_0_2px_4px_rgba(11,16,32,0.14),0_1px_0_rgba(255,255,255,0.9)]">
                    <button
                      type="button"
                      onClick={() => setActiveTab('news')}
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[0.78rem] font-medium tracking-tight transition-all ${
                        activeTab === 'news'
                          ? 'bg-[linear-gradient(180deg,#ffffff,#f3f3f6)] text-[#1d1d1f] shadow-[0_1px_0_rgba(255,255,255,1)_inset,0_1px_2px_rgba(11,16,32,0.18),0_3px_6px_-2px_rgba(11,16,32,0.18)]'
                          : 'text-[#7a7a7a] hover:text-[#1d1d1f]'
                      }`}
                    >
                      <Megaphone weight={activeTab === 'news' ? 'fill' : 'regular'} className="h-3.5 w-3.5 text-[#0066cc]" />
                      <span>Updates</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('research')}
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[0.78rem] font-medium tracking-tight transition-all ${
                        activeTab === 'research'
                          ? 'bg-[linear-gradient(180deg,#ffffff,#f3f3f6)] text-[#1d1d1f] shadow-[0_1px_0_rgba(255,255,255,1)_inset,0_1px_2px_rgba(11,16,32,0.18),0_3px_6px_-2px_rgba(11,16,32,0.18)]'
                          : 'text-[#7a7a7a] hover:text-[#1d1d1f]'
                      }`}
                    >
                      <Article weight={activeTab === 'research' ? 'fill' : 'regular'} className="h-3.5 w-3.5 text-[#0066cc]" />
                      <span>Papers</span>
                    </button>
                  </div>

                  {/* Apple Action Blue Text Link */}
                  <Link
                    href={activeTab === 'news' ? '/events' : '/publications'}
                    className="group inline-flex items-center gap-1 text-[0.8rem] font-medium text-[#0066cc] hover:text-[#0071e3] transition-colors"
                  >
                    <span>View all</span>
                    <ArrowUpRight
                      weight="bold"
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </Link>
                </div>

                {/* Content Stream with Crisp Dividers */}
                <div className="flex flex-1 flex-col justify-between divide-y divide-[#e2e4ea] px-6 py-2 mx-3 my-3 rounded-2xl bg-[#f8f9fb] shadow-[inset_0_2px_6px_rgba(11,16,32,0.1),inset_0_0_0_1px_rgba(11,16,32,0.04),0_1px_0_rgba(255,255,255,0.9)]">
                  {activeTab === 'news' ? (
                    allUpdates.length > 0 ? (
                      allUpdates.map((item, itemIdx) => {
                        const ItemTag = item.external ? 'a' : Link;
                        const props = item.external
                          ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' }
                          : { href: item.href };

                        return (
                          <article key={item.id} className="group py-5 transition-colors">
                            <ItemTag {...(props as any)} className="block">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2">
                                  <span
                                    className={`inline-block shrink-0 whitespace-nowrap rounded-md px-2.5 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider shadow-2xs ${getBadgeClasses(item.badge)}`}
                                  >
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
                              <p className={`mt-2 font-sans font-semibold leading-snug tracking-normal text-ink transition-colors group-hover:text-navy-700 ${itemIdx === 0 ? 'text-[1.1rem]' : 'text-[0.95rem]'}`}>
                                {item.title}
                              </p>
                              {item.detail && (
                                <p className="mt-1.5 text-xs font-sans leading-relaxed text-muted line-clamp-1">
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
                                <div className="flex min-w-0 items-center gap-2">
                                  <span
                                    className={`inline-block shrink-0 whitespace-nowrap rounded-md px-2.5 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider shadow-2xs ${getBadgeClasses(item.badge)}`}
                                  >
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

                {/* Apple Action Blue Bottom Footer Link */}
                <div className="border-t border-[#dcdee4] bg-transparent shadow-[0_-1px_0_rgba(255,255,255,0.8)] px-6 py-3.5 text-right">
                  <Link
                    href={activeTab === 'news' ? '/events' : '/publications'}
                    className="group inline-flex items-center gap-1.5 text-xs font-semibold text-[#0066cc] hover:text-[#0071e3] transition-colors"
                  >
                    <span>
                      {activeTab === 'news' ? 'All Events & News' : 'Complete Publication List'}
                    </span>
                    <ArrowRight weight="bold" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>

              </div>
            </div>
          </div>

        </div>
      </motion.div>

    </section>
  );
}

