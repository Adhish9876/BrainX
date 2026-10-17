'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Event, PictureGroup } from '@/lib/types';
import { formatDate } from '@/components/public/format';

type Slide = { id: string; image: string; title: string; meta: string; badge: string; href: string };

/** Shown until real photos exist; replaced automatically once pictures or events exist. */
const PLACEHOLDER_SLIDES: Slide[] = [
  { id: 'p1', image: '/media/pictures/demo_pic/photo-01.webp', title: 'Lab Moments & Activities', meta: 'BrainX Lab', badge: 'Pictures', href: '/pictures' },
  { id: 'p2', image: '/media/pictures/demo_pic/photo-05.webp', title: 'Workshops & Research Life', meta: 'BrainX Lab', badge: 'Pictures', href: '/pictures' },
  { id: 'p3', image: '/media/pictures/demo_pic/photo-03.webp', title: 'Team and Collaborations', meta: 'BrainX Lab', badge: 'Pictures', href: '/pictures' },
];

/**
 * Image carousel of the latest lab moments and events. Plays recent photos from both events and the pictures gallery.
 * Clicking a slide navigates to the relevant page (/events or /pictures). Auto-advances, pauses on hover, and supports swipe.
 */
export default function EventsImageCarousel({
  events = [],
  pictures = [],
}: {
  events?: Event[];
  pictures?: PictureGroup[];
}) {
  const eventSlides: { slide: Slide; date: string }[] = (events ?? [])
    .filter((event) => Boolean(event.image))
    .map((event) => ({
      slide: {
        id: `event-${event.id}`,
        image: event.image,
        title: event.title,
        meta: [formatDate(event.date), event.venue].filter(Boolean).join(' · '),
        badge: event.tags?.[0] || 'Event',
        href: event.link || '/events',
      },
      date: event.date || '',
    }));

  const pictureSlides: { slide: Slide; date: string }[] = (pictures ?? [])
    .flatMap((group) => {
      const photos = group.images && group.images.length > 0 ? group.images : (group.thumbnail ? [group.thumbnail] : []);
      // Feature up to 3 photos from recent albums
      const selected = photos.slice(0, 3);
      return selected.map((img, i) => ({
        slide: {
          id: `pic-${group.id}-${i}`,
          image: img,
          title: group.name,
          meta: [formatDate(group.date), group.description ? group.description.slice(0, 52) + (group.description.length > 52 ? '…' : '') : ''].filter(Boolean).join(' · '),
          badge: group.tags?.[0] || 'Pictures',
          href: '/pictures',
        },
        date: group.date || '',
      }));
    });

  const combinedSlides = [...eventSlides, ...pictureSlides]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((item) => item.slide)
    .slice(0, 8);

  const slides = combinedSlides.length > 0 ? combinedSlides : PLACEHOLDER_SLIDES;
  const count = slides.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [touchX, setTouchX] = useState<number | null>(null);

  const go = useCallback((dir: 1 | -1) => setIndex((i) => (i + dir + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => go(1), 4500);
    return () => window.clearInterval(timer);
  }, [count, paused, go, index]);

  const slide = slides[index % count];

  return (
    <div
      className="group/carousel relative w-full max-w-[29rem]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => setTouchX(e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        if (touchX === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? touchX) - touchX;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        setTouchX(null);
      }}
    >
      {/* Physical-object feel: two prints stacked behind, resting on the page with soft cast shadows */}
      <div className="relative mt-5">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 origin-bottom-left -rotate-[2.5deg] rounded-[1.7rem] border border-white/80 bg-white/85 shadow-[0_18px_30px_-14px_rgba(11,16,32,0.35)] transition-transform duration-500 group-hover/carousel:-rotate-[4deg]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 origin-bottom-right rotate-[2deg] rounded-[1.7rem] border border-white/80 bg-white/90 shadow-[0_18px_30px_-14px_rgba(11,16,32,0.35)] transition-transform duration-500 group-hover/carousel:rotate-[3.5deg]"
        />
      <Link
        href={slide.href}
        aria-label={`${slide.title} — open ${slide.badge}`}
        className="relative block aspect-[16/10] w-full overflow-hidden rounded-[1.7rem] border-[7px] border-white bg-slate-100 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_2px_3px_rgba(11,16,32,0.08),0_14px_24px_-8px_rgba(11,16,32,0.28),0_40px_60px_-30px_rgba(11,16,32,0.55)] transition-transform duration-500 group-hover/carousel:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-600 focus-visible:ring-offset-2"
      >
        <AnimatePresence initial={false}>
          <motion.img
            key={slide.id}
            src={slide.image}
            alt=""
            draggable={false}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>

        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        {/* Glass reflection and inner bevel, like a framed print under glass */}
        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0.06)_32%,transparent_46%)]" />
        <span className="pointer-events-none absolute inset-0 rounded-[1.1rem] shadow-[inset_0_2px_6px_rgba(0,0,0,0.25),inset_0_-1px_0_rgba(255,255,255,0.15)]" />

        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 font-mono text-[0.62rem] font-bold uppercase tracking-[0.2em] text-crimson-600 backdrop-blur">
          {slide.badge}
        </span>

        <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white">
          <span className="min-w-0">
            <span className="block truncate font-display text-base font-bold leading-snug sm:text-lg">
              {slide.title}
            </span>
            {slide.meta ? (
              <span className="mt-0.5 block truncate text-xs font-medium text-white/80">{slide.meta}</span>
            ) : null}
          </span>
          <span
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/90 text-[#1d1d1f] transition-transform duration-300 group-hover/carousel:rotate-45"
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </span>
      </Link>
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous event photo"
            className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-md transition hover:bg-white hover:text-black group-hover/carousel:opacity-100 focus-visible:opacity-100 cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next event photo"
            className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-md transition hover:bg-white hover:text-black group-hover/carousel:opacity-100 focus-visible:opacity-100 cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="mt-6 hidden md:flex items-center gap-1.5" role="tablist" aria-label="Event photos">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index % count}
                aria-label={`Show ${s.title}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  i === index % count ? 'w-7 bg-[#1d1d1f]' : 'w-2 bg-slate-400/60 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
