'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import type { Event } from '@/lib/types';
import { formatDate } from './format';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function dateParts(value: string): { day: string; month: string; year: string } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return { day: String(Number(match[3])), month: MONTHS[Number(match[2]) - 1] ?? match[2], year: match[1] };
}

/** Events as a swipeable carousel: a large image per event with its description written underneath. */
export default function EventCarousel({ events }: { events: Event[] }) {
  const sorted = [...events].sort((a, b) => b.date.localeCompare(a.date));
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    const pad = parseFloat(getComputedStyle(el).paddingLeft || '0');
    const cards = Array.from(el.querySelectorAll<HTMLElement>('[data-slide]'));
    let best = 0;
    let bestDist = Infinity;
    cards.forEach((card, i) => {
      const dist = Math.abs(card.offsetLeft - pad - el.scrollLeft);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setActive(best);
  }, []);

  useEffect(() => {
    update();
    const el = scrollerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update, sorted.length]);

  const goTo = (index: number) => {
    const el = scrollerRef.current;
    const card = el?.querySelectorAll<HTMLElement>('[data-slide]')[index];
    if (!el || !card) return;
    const pad = parseFloat(getComputedStyle(el).paddingLeft || '0');
    el.scrollTo({ left: card.offsetLeft - pad, behavior: 'smooth' });
  };

  if (sorted.length === 0) return null;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {String(active + 1).padStart(2, '0')} <span className="text-slate-300">/</span>{' '}
          {String(sorted.length).padStart(2, '0')}
        </p>
        <div className="flex items-center gap-2">
          {(['prev', 'next'] as const).map((dir) => {
            const disabled = dir === 'prev' ? edge.start : edge.end;
            return (
              <button
                key={dir}
                type="button"
                disabled={disabled}
                onClick={() =>
                  goTo(Math.max(0, Math.min(sorted.length - 1, active + (dir === 'next' ? 1 : -1))))
                }
                aria-label={dir === 'next' ? 'Next event' : 'Previous event'}
                className="grid h-11 w-11 place-items-center rounded-full border border-slate-300 bg-white text-[#1d1d1f] transition-all hover:border-[#1d1d1f] hover:bg-[#1d1d1f] hover:text-white disabled:pointer-events-none disabled:opacity-35 cursor-pointer"
              >
                {dir === 'next' ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              </button>
            );
          })}
        </div>
      </div>

      <div
        ref={scrollerRef}
        onScroll={update}
        style={{ scrollbarWidth: 'none' }}
        className="flex snap-x snap-mandatory items-start gap-8 overflow-x-auto pb-6 [&::-webkit-scrollbar]:hidden"
      >
        {sorted.map((event, index) => {
          const parts = dateParts(event.date);
          const date = formatDate(event.date);
          return (
            <article
              key={event.id}
              data-slide
              className="w-[88vw] shrink-0 snap-start sm:w-[34rem] lg:w-[40rem]"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-gradient-to-br from-sky-100 via-orange-50 to-white shadow-[0_2px_4px_rgba(11,16,32,0.04),0_24px_50px_-26px_rgba(11,16,32,0.35)]">
                {event.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.image}
                    alt={event.title}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                ) : parts ? (
                  <div className="flex h-full w-full flex-col items-center justify-center text-[#1d1d1f]/80">
                    <span className="font-display text-8xl font-extrabold leading-none tracking-tight">
                      {parts.day}
                    </span>
                    <span className="mt-2 font-mono text-sm font-bold tracking-[0.3em]">
                      {parts.month} {parts.year}
                    </span>
                  </div>
                ) : null}
                {index === 0 ? (
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-crimson-600 backdrop-blur">
                    Latest
                  </span>
                ) : null}
              </div>

              <div className="mt-6 px-1">
                <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
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

                <h3 className="mt-3 font-display text-2xl font-bold leading-snug tracking-tight text-[#1d1d1f] sm:text-[1.7rem]">
                  {event.title}
                </h3>

                {event.description ? (
                  <p className="mt-3 max-w-2xl whitespace-pre-line text-[0.95rem] leading-relaxed text-[#424245]">
                    {event.description}
                  </p>
                ) : null}

                {event.link ? (
                  <a
                    href={event.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1d1d1f] underline decoration-slate-300 underline-offset-4 transition-colors hover:decoration-[#1d1d1f]"
                  >
                    More info
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
        <span aria-hidden="true" className="w-1 shrink-0" />
      </div>

      {sorted.length > 1 ? (
        <div className="mt-4 flex items-center gap-1.5" role="tablist" aria-label="Events">
          {sorted.map((event, i) => (
            <button
              key={event.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Show event ${i + 1}: ${event.title}`}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                i === active ? 'w-7 bg-[#1d1d1f]' : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
