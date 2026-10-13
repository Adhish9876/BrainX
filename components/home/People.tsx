'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { ArrowUpRight } from '@phosphor-icons/react';
import type { Member } from '@/lib/types';

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

export default function People({ team }: { team: Member[] }) {
  if (team.length === 0) return null;

  const principal = team.find((m) => m.role === 'Principal Investigator');
  const sectionRef = useRef<HTMLElement>(null);

  // Track scroll from entering bottom of viewport (start end) up to reaching 1/3 of the page (start 33%)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'start 33%'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 130,
    damping: 26,
    restDelta: 0.001,
  });

  // Eyebrow top divider
  const eyebrowOpacity = useTransform(smoothProgress, [0.08, 0.5], [0, 1]);
  const eyebrowY = useTransform(smoothProgress, [0.08, 0.5], [-16, 0]);

  // Step 1: Big "Principal Investigator" starts from top-left and glides into center
  const piOpacity = useTransform(smoothProgress, [0.1, 0.65], [0, 1]);
  const piX = useTransform(smoothProgress, [0.1, 0.65], [-140, 0]);

  // Step 2: Name & designation appear underneath
  const nameOpacity = useTransform(smoothProgress, [0.2, 0.72], [0, 1]);
  const nameY = useTransform(smoothProgress, [0.2, 0.72], [28, 0]);

  // Step 3: Bio description appears
  const descOpacity = useTransform(smoothProgress, [0.28, 0.82], [0, 1]);
  const descY = useTransform(smoothProgress, [0.28, 0.82], [24, 0]);

  // Step 4: Tags and CTA appear
  const tagsOpacity = useTransform(smoothProgress, [0.38, 0.95], [0, 1]);
  const tagsY = useTransform(smoothProgress, [0.38, 0.95], [20, 0]);

  // Portrait image rises from the bottom
  const portraitOpacity = useTransform(smoothProgress, [0.2, 0.9], [0, 1]);
  const portraitY = useTransform(smoothProgress, [0.2, 0.9], [60, 0]);
  const portraitScale = useTransform(smoothProgress, [0.2, 0.9], [0.95, 1]);

  const contourOpacity = useTransform(smoothProgress, [0.25, 0.85], [0, 0.6]);

  return (
    <section
      ref={sectionRef}
      id="people"
      aria-labelledby="people-heading"
      className="relative isolate overflow-hidden bg-black text-white min-h-[100svh] w-full flex flex-col justify-between pt-8 pb-0 md:pt-10"
    >
      {/* Right decorative contour background - appears with scroll */}
      <motion.img
        style={{ opacity: contourOpacity }}
        src="/rightbg.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none select-none absolute -right-28 top-0 -z-10 h-full w-auto max-w-[70vw] object-cover object-right sm:-right-36 lg:-right-48"
      />

      <div className="shell flex-1 flex flex-col justify-between">
        {/* Eyebrow + title indicator */}
        <motion.div
          style={{ opacity: eyebrowOpacity, y: eyebrowY }}
          className="mb-3 flex items-center gap-6"
        >
          <span className="h-px flex-1 bg-white/15" />
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-white/50">
            03 — People
          </span>
          <span className="h-px w-10 bg-white/15" />
        </motion.div>

        {/* TOP CENTER: "Principal Investigator" (toned down size, hollow 'Investigator', on scroll glides from top-left into center) */}
        <div className="w-full text-center py-1 sm:py-2">
          <motion.h2
            id="people-heading"
            style={{ opacity: piOpacity, x: piX }}
            className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-white leading-tight"
          >
            Principal{' '}
            <span className="text-transparent [-webkit-text-stroke:1.2px_rgba(255,255,255,0.85)] font-semibold">
              Investigator
            </span>
          </motion.h2>
        </div>

        {/* MAIN BODY: Left details + Right portrait anchored to bottom */}
        <div className="grid items-end gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 flex-1 mt-auto pb-0">
          {/* Left — PI profile & details */}
          {principal && (
            <div className="max-w-2xl pb-6 lg:pb-10 pt-2">
              {/* Name & Designation */}
              <motion.div style={{ opacity: nameOpacity, y: nameY }}>
                <h3 className="font-display text-3xl sm:text-4xl lg:text-[2.6rem] font-bold tracking-tight text-white leading-tight">
                  {principal.name}
                </h3>
                {principal.position && (
                  <p className="mt-2 font-mono text-xs sm:text-sm md:text-[0.92rem] text-crimson-400">
                    {principal.position}
                  </p>
                )}
              </motion.div>

              {/* Bio Description */}
              {principal.description && (
                <motion.p
                  style={{ opacity: descOpacity, y: descY }}
                  className="mt-4 sm:mt-5 max-w-prose text-base sm:text-lg lg:text-[1.12rem] font-sans leading-[1.75] text-white/85"
                >
                  {principal.description}
                </motion.p>
              )}

              {/* Expertise tags & Full team link */}
              <motion.div style={{ opacity: tagsOpacity, y: tagsY }}>
                {principal.tags.length > 0 && (
                  <div className="mt-5 sm:mt-6 flex flex-wrap gap-2.5">
                    {principal.tags.map((tag) => (
                      <span
                        key={tag}
                        className="border border-white/20 bg-white/[0.05] px-3.5 py-1.5 font-mono text-[0.72rem] sm:text-[0.78rem] uppercase tracking-[0.09em] text-white/90 rounded-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <Link
                  href="/team"
                  className="group mt-6 sm:mt-8 inline-flex items-center gap-2.5 border border-white/30 bg-white/[0.05] px-6 py-3 font-mono text-xs sm:text-[0.8rem] uppercase tracking-[0.14em] text-white transition-all hover:border-white hover:bg-white hover:text-black rounded-sm"
                >
                  Full team
                  <ArrowUpRight
                    weight="bold"
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden
                  />
                </Link>
              </motion.div>
            </div>
          )}

          {/* Right — PI portrait anchored flush to the bottom, enlarged */}
          <motion.div
            style={{ opacity: portraitOpacity, y: portraitY, scale: portraitScale }}
            className="flex items-end justify-center self-end lg:justify-end"
          >
            <img
              src="/kan.png"
              alt={principal?.name ?? 'Principal Investigator'}
              className="block max-h-[58vh] sm:max-h-[68vh] lg:max-h-[76vh] xl:max-h-[80vh] w-auto object-contain object-bottom select-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
