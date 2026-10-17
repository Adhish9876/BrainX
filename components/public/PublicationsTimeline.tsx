'use client';

import * as React from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { ArrowUpRight, BookOpen, Calendar, Layers } from 'lucide-react';
import type { Publication } from '@/lib/types';
import TagList from './TagList';
import { publicationFallbackImages } from './publications.config';

type PublicationYearGroup = { year: number; items: Publication[] };

function groupPublicationsByYear(publications: Publication[]): PublicationYearGroup[] {
  const byYear = new Map<number, Publication[]>();
  for (const publication of publications) {
    const bucket = byYear.get(publication.year);
    if (bucket) bucket.push(publication);
    else byYear.set(publication.year, [publication]);
  }
  return [...byYear.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, items]) => ({ year, items }));
}

export default function PublicationsTimeline({
  publications,
  yearImages = {},
}: {
  publications: Publication[];
  yearImages?: Record<string, string>;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scrollBlur, setScrollBlur] = React.useState(0);

  // Background smooth blur on scroll
  React.useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const blur = Math.min(18, Math.max(0, (y / 200) * 18));
      setScrollBlur(blur);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animated drawing of the timeline vertical progress line on scroll
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 75%', 'end 90%'],
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Group publications by year (2026, 2025, 2024...)
  const yearGroups = React.useMemo(() => {
    return groupPublicationsByYear(publications);
  }, [publications]);

  return (
    <>
      {/* Dynamic blurred background — stays visible and blurs smoothly on scroll */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none fixed inset-0 -z-10 overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/publications_bg.png"
          alt=""
          draggable={false}
          style={{
            filter: `blur(${scrollBlur}px)`,
            transform: 'scale(1.06)',
            willChange: 'filter',
            transition: 'filter 0.15s ease-out',
          }}
          className="absolute inset-0 h-full w-full object-cover object-left-top opacity-60 mix-blend-multiply"
        />
      </div>

      <div ref={containerRef} className="relative w-full space-y-12 sm:space-y-16">
        {/* ── 1. Centered Header: The Journey That Shaped Us ── */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-4xl text-center"
        >
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#1d1d1f] sm:text-5xl lg:text-6xl">
            The Journey That Shaped Us
          </h1>

          <p className="mt-4 text-base leading-relaxed text-slate-700 sm:text-xl">
            From foundational biosignal processing to cutting-edge neural decoding and assistive BCIs,
            our publications reflect continuous inquiry, clinical persistence, and academic growth.
          </p>

          <p className="mt-2.5 text-xs font-mono font-medium uppercase tracking-wider text-slate-500">
            {publications.length} {publications.length === 1 ? 'publication record' : 'publication records'} · grouped by year
          </p>
        </motion.div>

        {/* ── 2. Alternating Year-Grouped Timeline ── */}
        <div className="relative mx-auto max-w-5xl py-4 sm:py-6">
          {/* Central Vertical Line (Both Mobile & Desktop) */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-4 bottom-4 w-0.5 -translate-x-1/2 bg-slate-200/90"
          >
            {/* Animated Progress Beam drawing down as user scrolls */}
            <motion.div
              style={{ scaleY, originY: 0 }}
              className="absolute left-0 top-0 w-full h-full bg-gradient-to-b from-[#0066cc] via-[#0099ff] to-[#0066cc] shadow-[0_0_12px_rgba(0,102,204,0.5)]"
            />
          </div>

          {/* Year Milestone Sections */}
          <div className="space-y-10 xs:space-y-12 sm:space-y-20 md:space-y-24">
            {yearGroups.map((group, groupIndex) => {
              // Even groupIndex (0, 2, 4): Cards on RIGHT, Year Marker on LEFT (e.g. 2026 on right)
              // Odd groupIndex (1, 3, 5): Cards on LEFT, Year Marker on RIGHT (e.g. 2025 on left)
              const isCardsRight = groupIndex % 2 === 0;

              return (
                <div key={group.year} className="relative">
                  {/* Central Node for this Year on the line */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    aria-hidden="true"
                    className="absolute z-20 flex left-1/2 top-5 sm:top-7 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-white border-2 border-[#0066cc] ring-2 sm:ring-4 ring-[#0066cc]/15 shadow-sm"
                  >
                    <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#0066cc]" />
                  </motion.div>

                  {/* Responsive 2-Column Grid Layout (Alternating on either side) */}
                  <div className="grid grid-cols-2 gap-2 xs:gap-3.5 sm:gap-8 md:gap-14 items-start">
                    {isCardsRight ? (
                      /* ── Year on Left, All Cards on Right ── */
                      <>
                        {/* Left Side: full-cover year image with milestone badge */}
                        <YearVisual
                          year={group.year}
                          count={group.items.length}
                          image={yearImage(group.year, groupIndex, group.items, yearImages)}
                          side="left"
                        />

                        {/* Right Side: All cards of this year stacked */}
                        <div className="space-y-2.5 xs:space-y-3.5 sm:space-y-6 pl-1 xs:pl-2 sm:pl-4 md:pl-6">
                          {group.items.map((publication, itemIndex) => (
                            <motion.div
                              key={publication.id}
                              initial={{ opacity: 0, y: 20, filter: 'blur(3px)' }}
                              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                              viewport={{ once: true, margin: '-30px' }}
                              transition={{
                                duration: 0.5,
                                ease: [0.16, 1, 0.3, 1],
                                delay: itemIndex * 0.06,
                              }}
                            >
                              <PublicationCard
                                publication={publication}
                                index={itemIndex + 1}
                              />
                            </motion.div>
                          ))}
                        </div>
                      </>
                    ) : (
                      /* ── All Cards on Left, Year on Right ── */
                      <>
                        {/* Left Side: All cards of this year stacked */}
                        <div className="space-y-2.5 xs:space-y-3.5 sm:space-y-6 pr-1 xs:pr-2 sm:pr-4 md:pr-6">
                          {group.items.map((publication, itemIndex) => (
                            <motion.div
                              key={publication.id}
                              initial={{ opacity: 0, y: 20, filter: 'blur(3px)' }}
                              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                              viewport={{ once: true, margin: '-30px' }}
                              transition={{
                                duration: 0.5,
                                ease: [0.16, 1, 0.3, 1],
                                delay: itemIndex * 0.06,
                              }}
                            >
                              <PublicationCard
                                publication={publication}
                                index={itemIndex + 1}
                              />
                            </motion.div>
                          ))}
                        </div>

                        {/* Right Side: full-cover year image with milestone badge */}
                        <YearVisual
                          year={group.year}
                          count={group.items.length}
                          image={yearImage(group.year, groupIndex, group.items, yearImages)}
                          side="right"
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Image for a year's empty side: the photo set for that year in the admin, else a rotating fallback photo.
 */
function yearImage(year: number, groupIndex: number, items: Publication[], yearImages: Record<string, string>): string {
  return (
    yearImages[String(year)] ||
    items.find((item) => item.image)?.image ||
    publicationFallbackImages[groupIndex % publicationFallbackImages.length]
  );
}

// Feathers all four edges so the photo dissolves into the page background instead of reading as a box
const FEATHER_MASK: React.CSSProperties = {
  WebkitMaskImage:
    'linear-gradient(to right, transparent, black 22%, black 78%, transparent), linear-gradient(to bottom, transparent, black 16%, black 84%, transparent)',
  maskImage:
    'linear-gradient(to right, transparent, black 22%, black 78%, transparent), linear-gradient(to bottom, transparent, black 16%, black 84%, transparent)',
  WebkitMaskComposite: 'source-in',
  maskComposite: 'intersect',
};

/** Full-cover image filling the empty side of a year, blended into the page, with the milestone badge pinned on top. */
function YearVisual({
  year,
  count,
  image,
  side,
}: {
  year: number;
  count: number;
  image: string;
  side: 'left' | 'right';
}) {
  // The badge hugs the edge nearest the central timeline dot
  const nearLine = side === 'left';
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      className="relative min-h-[9rem] xs:min-h-[11rem] sm:min-h-[18rem] md:min-h-[22rem] self-stretch"
    >
      {/* Feathered image layer (separate from the badge so the badge can stay sticky) */}
      <div className="absolute inset-0 overflow-hidden" style={FEATHER_MASK}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          loading="lazy"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* Milestone badge stays in view while this year's cards scroll */}
      <div className={`sticky top-20 sm:top-28 z-10 flex pt-1 sm:pt-3 ${nearLine ? 'justify-end' : 'justify-start'}`}>
        <div className={`relative flex flex-col px-1 py-1 sm:px-2 sm:py-2 ${nearLine ? '-mr-1 sm:-mr-3 items-end text-right' : '-ml-1 sm:-ml-3 items-start text-left'}`}>
          {/* Soft white halo (no hard edges) so the dark text stays readable over any photo */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-6 sm:-inset-x-10 -inset-y-4 sm:-inset-y-8 -z-10"
            style={{
              background:
                'radial-gradient(closest-side, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.7) 45%, rgba(255,255,255,0) 100%)',
            }}
          />
          <span className="font-mono text-[0.52rem] xs:text-[0.58rem] sm:text-[0.65rem] font-bold uppercase tracking-[0.14em] sm:tracking-[0.2em] text-[#0066cc]">
            Milestone
          </span>
          <h2 className="font-display text-lg xs:text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#1d1d1f]">
            {year}
          </h2>
          <div className="mt-1 sm:mt-1.5 inline-flex items-center gap-1 rounded-full bg-slate-900 px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 text-[0.55rem] sm:text-[0.68rem] font-semibold text-white">
            <BookOpen className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
            <span>
              {count} {count === 1 ? 'pub' : 'pubs'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/** Solid white publication card (100% opaque, zero translucency) */
function PublicationCard({
  publication,
  index,
}: {
  publication: Publication;
  index: number;
}) {
  return (
    <article
      style={{ backgroundColor: '#ffffff' }}
      className="group relative w-full rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white p-2 xs:p-2.5 sm:p-5 md:p-7 shadow-[0_4px_14px_-3px_rgba(11,16,32,0.06)] sm:shadow-[0_10px_28px_-8px_rgba(11,16,32,0.08),0_4px_12px_-3px_rgba(11,16,32,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_38px_-10px_rgba(11,16,32,0.13),0_6px_16px_-4px_rgba(11,16,32,0.06)]"
    >
      <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2.5">
        <span className="font-mono text-[0.52rem] xs:text-[0.58rem] sm:text-[0.65rem] font-bold uppercase tracking-[0.12em] sm:tracking-[0.2em] text-[#0066cc]">
          Paper {String(index).padStart(2, '0')}
        </span>
        <span className="text-slate-300">·</span>
        <span className="font-mono text-[0.52rem] xs:text-[0.58rem] sm:text-[0.65rem] font-semibold text-slate-500">
          {publication.year}
        </span>
      </div>

      <h3 className="font-display text-[0.75rem] xs:text-[0.82rem] sm:text-base md:text-xl font-bold leading-snug tracking-tight text-[#1d1d1f]">
        {publication.link ? (
          <a
            href={publication.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-baseline gap-1 transition-colors hover:text-[#0066cc]"
          >
            <span className="break-words">{publication.title}</span>
            <ArrowUpRight
              className="inline-block h-3 w-3 sm:h-4 sm:w-4 shrink-0 translate-y-0.5 text-[#0066cc] opacity-75 group-hover:opacity-100"
              aria-hidden
            />
          </a>
        ) : (
          <span className="break-words">{publication.title}</span>
        )}
      </h3>

      <p className="mt-1 sm:mt-2.5 text-[0.65rem] xs:text-[0.7rem] sm:text-xs md:text-sm leading-snug sm:leading-relaxed text-slate-600 line-clamp-3 md:line-clamp-none">
        {publication.authors}
      </p>

      {publication.venue ? (
        <p className="mt-1 sm:mt-2 text-[0.62rem] xs:text-[0.66rem] sm:text-xs md:text-sm font-medium italic text-[#0066cc] line-clamp-2 md:line-clamp-none">
          {publication.venue}
        </p>
      ) : null}

      {publication.tags && publication.tags.length > 0 ? (
        <div className="mt-1.5 sm:mt-4 pt-0.5 sm:pt-1">
          <TagList
            tags={publication.tags}
            className="gap-1 [&_li]:px-1.5 [&_li]:py-0.5 [&_li]:text-[0.55rem] xs:[&_li]:text-[0.6rem] sm:[&_li]:px-2.5 sm:[&_li]:text-[0.72rem]"
          />
        </div>
      ) : null}
    </article>
  );
}
