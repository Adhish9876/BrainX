'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import type { Event } from '@/lib/types';
import { formatDate } from './format';

function Meta({ event, center = false }: { event: Event; center?: boolean }) {
  const date = formatDate(event.date);
  return (
    <ul
      className={`flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 ${center ? 'justify-center' : ''}`}
    >
      {date ? (
        <li className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          {date}
        </li>
      ) : null}
      {event.time ? (
        <li className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {event.time}
        </li>
      ) : null}
      {event.venue ? (
        <li className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {event.venue}
        </li>
      ) : null}
    </ul>
  );
}

function MoreInfo({ link }: { link: string }) {
  if (!link) return null;
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1d1d1f] underline decoration-slate-300 underline-offset-4 transition-colors hover:decoration-[#1d1d1f]"
    >
      More info
      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
    </a>
  );
}

/**
 * Events page: the latest event is shown large and centred. Everything else is a simple bulleted list;
 * picking one opens a smaller carousel (swipe or use the arrows) starting at that event.
 */
export default function EventsShowcase({ events }: { events: Event[] }) {
  const sorted = [...events].sort((a, b) => b.date.localeCompare(a.date));
  const [featured, ...rest] = sorted;
  const [open, setOpen] = useState<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const goTo = (index: number, smooth = true) => {
    const el = scrollerRef.current;
    const slide = el?.querySelectorAll<HTMLElement>('[data-slide]')[index];
    if (el && slide) el.scrollTo({ left: slide.offsetLeft - el.offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
  };

  // When the carousel opens (or another bullet is picked), bring it to that event
  useEffect(() => {
    if (open !== null) goTo(open, false);
  }, [open]);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const slides = Array.from(el.querySelectorAll<HTMLElement>('[data-slide]'));
    let best = 0;
    let bestDist = Infinity;
    slides.forEach((slide, i) => {
      const dist = Math.abs(slide.offsetLeft - el.offsetLeft - el.scrollLeft);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setOpen((cur) => (cur === null || cur === best ? cur : best));
  };

  if (!featured) return null;

  return (
    <div>
      {/* Latest event, centred */}
      <article className="mx-auto max-w-3xl text-center">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-sky-100 via-orange-50 to-white shadow-[0_2px_4px_rgba(11,16,32,0.04),0_28px_56px_-28px_rgba(11,16,32,0.35)]">
          {featured.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={featured.image} alt={featured.title} draggable={false} className="h-full w-full object-cover" />
          ) : null}
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-crimson-600 backdrop-blur">
            Latest
          </span>
        </div>
        <div className="mt-7">
          <Meta event={featured} center />
          <h2 className="mt-3 font-display text-2xl font-bold leading-snug tracking-tight text-[#1d1d1f] sm:text-3xl">{featured.title}</h2>
          {featured.description ? (
            <p className="mx-auto mt-3 max-w-2xl whitespace-pre-line text-[1rem] leading-relaxed text-[#424245]">{featured.description}</p>
          ) : null}
          <MoreInfo link={featured.link} />
        </div>
      </article>

      {/* Everything else */}
      {rest.length > 0 ? (
        <section className="mx-auto mt-16 max-w-3xl" aria-labelledby="more-events">
          <h3 id="more-events" className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            More events
          </h3>
          <ul className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
            {rest.map((event, i) => {
              const active = open === i;
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    aria-expanded={active}
                    onClick={() => {
                      setOpen(active ? null : i);
                      if (!active) window.setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
                    }}
                    className="flex w-full cursor-pointer items-baseline gap-3 py-3.5 text-left transition-colors hover:text-[#1d1d1f]"
                  >
                    <span aria-hidden="true" className={`mt-[0.55rem] size-1.5 shrink-0 rounded-full ${active ? 'bg-crimson-600' : 'bg-slate-400'}`} />
                    <span className={`flex-1 text-[1.02rem] ${active ? 'font-semibold text-[#1d1d1f]' : 'text-[#424245]'}`}>{event.title}</span>
                    <span className="shrink-0 font-mono text-xs tracking-wide text-slate-500">{formatDate(event.date)}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Smaller carousel, opened from the list */}
          <div ref={panelRef} className={`grid transition-all duration-500 ease-out ${open !== null ? 'mt-6 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {String((open ?? 0) + 1).padStart(2, '0')} <span className="text-slate-300">/</span> {String(rest.length).padStart(2, '0')}
                </p>
                <div className="flex items-center gap-2">
                  {(['prev', 'next'] as const).map((dir) => {
                    const target = (open ?? 0) + (dir === 'next' ? 1 : -1);
                    const disabled = target < 0 || target >= rest.length;
                    return (
                      <button
                        key={dir}
                        type="button"
                        disabled={disabled}
                        aria-label={dir === 'next' ? 'Next event' : 'Previous event'}
                        onClick={() => {
                          setOpen(target);
                          goTo(target);
                        }}
                        className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-slate-300 bg-white text-[#1d1d1f] transition-all hover:border-[#1d1d1f] hover:bg-[#1d1d1f] hover:text-white disabled:pointer-events-none disabled:opacity-35"
                      >
                        {dir === 'next' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                ref={scrollerRef}
                onScroll={onScroll}
                style={{ scrollbarWidth: 'none' }}
                className="flex snap-x snap-mandatory gap-4 overflow-x-auto [&::-webkit-scrollbar]:hidden"
              >
                {rest.map((event) => (
                  <article key={event.id} data-slide className="w-full shrink-0 snap-start">
                    <div className="grid gap-5 rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:grid-cols-[13rem_1fr] sm:p-5">
                      <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-gradient-to-br from-sky-100 via-orange-50 to-white sm:aspect-auto sm:h-full sm:min-h-[9rem]">
                        {event.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={event.image} alt={event.title} draggable={false} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <Meta event={event} />
                        <h4 className="mt-2 font-display text-lg font-bold leading-snug text-[#1d1d1f]">{event.title}</h4>
                        {event.description ? (
                          <p className="mt-2 line-clamp-4 whitespace-pre-line text-[0.92rem] leading-relaxed text-[#424245]">{event.description}</p>
                        ) : null}
                        <MoreInfo link={event.link} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
