'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import { ArrowUpRight } from '@phosphor-icons/react';
import Reveal from './Reveal';

type Pillar = {
  id: string;
  number: string;
  title: string;
  image: string;
  shortSummary: string;
  position: 'tl' | 'tr' | 'bl' | 'br';
};

const PILLARS: Pillar[] = [
  {
    id: 'bci',
    number: '01',
    title: 'Brain–Computer Interfaces',
    image: '/assets/1st-Photoroom.png',
    shortSummary:
      'Decoding imagined speech and motor intent to control external assistive devices.',
    position: 'tl',
  },
  {
    id: 'eeg-signal-processing',
    number: '02',
    title: 'EEG Signal Processing',
    image: '/assets/2nd-Photoroom.png',
    shortSummary:
      'Multi-channel noise cleaning, CSP-TP feature extraction, and time-frequency decomposition.',
    position: 'tr',
  },
  {
    id: 'affective-computing',
    number: '03',
    title: 'Affective Computing',
    image: '/assets/3rd-Photoroom.png',
    shortSummary:
      'Decoding emotional intelligence, personality traits, and stress from biosignals.',
    position: 'bl',
  },
  {
    id: 'machine-learning',
    number: '04',
    title: 'Machine Learning',
    image: '/assets/4th-Photoroom.png',
    shortSummary:
      'Subject-independent deep neural networks and transfer learning for neural prediction.',
    position: 'br',
  },
];

export default function WhatWeDo() {
  const [hoveredPillar, setHoveredPillar] = useState<Pillar | null>(null);
  const containerRef = useRef<HTMLElement>(null);

  // Track scroll strictly within this section [start enters viewport, center in viewport]
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 92%', 'start 25%'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 160,
    damping: 24,
    restDelta: 0.001,
  });

  // 1. Title scroll tracking: Fades in from left and glides directly to center
  const titleOpacity = useTransform(smoothProgress, [0, 0.45], [0, 1]);
  const titleX = useTransform(smoothProgress, [0, 0.45], [-140, 0]);

  // 2. Center Brain: Scale in and fade in as user scrolls
  const brainOpacity = useTransform(smoothProgress, [0.15, 0.55], [0, 1]);
  const brainScale = useTransform(smoothProgress, [0.15, 0.55], [0.75, 1]);

  // 3. Four Outer Domains: Glide inward from corners toward their positions
  const tlX = useTransform(smoothProgress, [0.25, 0.8], [-60, 0]);
  const tlY = useTransform(smoothProgress, [0.25, 0.8], [-40, 0]);
  const tlOpacity = useTransform(smoothProgress, [0.25, 0.7], [0, 1]);

  const trX = useTransform(smoothProgress, [0.25, 0.8], [60, 0]);
  const trY = useTransform(smoothProgress, [0.25, 0.8], [-40, 0]);
  const trOpacity = useTransform(smoothProgress, [0.25, 0.7], [0, 1]);

  const blX = useTransform(smoothProgress, [0.35, 0.9], [-60, 0]);
  const blY = useTransform(smoothProgress, [0.35, 0.9], [40, 0]);
  const blOpacity = useTransform(smoothProgress, [0.35, 0.8], [0, 1]);

  const brX = useTransform(smoothProgress, [0.35, 0.9], [60, 0]);
  const brY = useTransform(smoothProgress, [0.35, 0.9], [40, 0]);
  const brOpacity = useTransform(smoothProgress, [0.35, 0.8], [0, 1]);

  // Connecting lines opacity
  const linesOpacity = useTransform(smoothProgress, [0.45, 0.85], [0, 0.45]);

  return (
    <section
      ref={containerRef}
      id="what-we-do"
      aria-labelledby="what-heading"
      className="relative bg-paper pt-6 pb-4 md:pt-8 md:pb-6 border-t border-ink/10 overflow-hidden"
    >
      <div className="mx-auto w-full max-w-[1220px] px-4 sm:px-6 lg:px-8">
        {/* ── DESKTOP WHITEBOARD CANVAS ── */}
        <div className="hidden lg:block relative mx-auto w-full aspect-[1672/941] select-none">
          {/* Whiteboard background image in exact native aspect ratio */}
          <Image
            src="/Board.png"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 1220px, 100vw"
            className="pointer-events-none object-contain drop-shadow-[0_20px_40px_rgba(11,16,32,0.10)]"
          />

          {/* Inner whiteboard drawing surface (avoids silver frame & bottom marker tray) */}
          <div className="absolute inset-x-[4.5%] top-[2.5%] bottom-[8.5%]">
            {/* Title inside top of whiteboard */}
            <div className="flex flex-col items-center text-center">
              <h2 id="what-heading" className="sr-only">
                Our Research Domains
              </h2>
              <motion.div style={{ opacity: titleOpacity, x: titleX }}>
                <img
                  src="/research_domain.png"
                  alt="Our Research Domains"
                  className="h-20 w-auto object-contain xl:h-24"
                />
              </motion.div>
            </div>

            {/* Diagram area below title */}
            <div className="relative -mt-4 h-[calc(100%-3.5rem)] w-full">
              {/* Connecting Curved Guide Lines - Scroll Driven */}
              <motion.svg
                style={{ opacity: linesOpacity }}
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 1000 560"
                fill="none"
                preserveAspectRatio="none"
              >
                {/* Top-Left: BCI */}
                <path
                  d="M 310 165 C 370 195, 425 235, 460 260"
                  stroke="#0284c7"
                  strokeWidth="2.4"
                  strokeDasharray="5 5"
                />
                {/* Top-Right: EEG */}
                <path
                  d="M 690 165 C 630 195, 575 235, 540 260"
                  stroke="#059669"
                  strokeWidth="2.4"
                  strokeDasharray="5 5"
                />
                {/* Bottom-Left: Affective */}
                <path
                  d="M 310 395 C 370 365, 425 325, 460 300"
                  stroke="#d97706"
                  strokeWidth="2.4"
                  strokeDasharray="5 5"
                />
                {/* Bottom-Right: ML */}
                <path
                  d="M 690 395 C 630 365, 575 325, 540 300"
                  stroke="#7c3aed"
                  strokeWidth="2.4"
                  strokeDasharray="5 5"
                />
              </motion.svg>

              {/* Central Brain Core with Dynamic Thought Bubble emerging directly from it */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
                {/* Thought Bubble: positioned in the open upper-right area above brain */}
                <AnimatePresence>
                  {hoveredPillar && (
                    <motion.div
                      key={hoveredPillar.id}
                      initial={{ opacity: 0, scale: 0.8, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 8 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                      className="pointer-events-none absolute -top-52 left-[74%] -translate-x-1/2 z-50 w-[260px] h-[260px] filter drop-shadow-[0_16px_36px_rgba(0,0,0,0.18)]"
                    >
                      <div className="relative w-full h-full">
                        <Image
                          src="/assets/bubble-clean.png"
                          alt="Thought Bubble"
                          fill
                          className="object-contain"
                          priority
                        />

                        <div className="absolute inset-x-11 top-9 bottom-26 flex flex-col items-center justify-center text-center">
                          <h4 className="font-sans text-[0.76rem] font-bold leading-tight text-black max-w-[160px]">
                            {hoveredPillar.title}
                          </h4>

                          <p className="mt-1 font-sans text-[0.62rem] font-medium leading-relaxed text-black/90 max-w-[165px]">
                            {hoveredPillar.shortSummary}
                          </p>

                          <span className="mt-1.5 inline-flex items-center gap-1 font-mono text-[0.55rem] font-bold text-black/80">
                            <span>Click node to view</span>
                            <ArrowUpRight weight="bold" className="h-2 w-2" />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Central Brain Illustration - Scroll Linked */}
                <motion.div
                  style={{ opacity: brainOpacity, scale: brainScale }}
                  className="relative w-52 h-42 xl:w-60 xl:h-48 filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.06)]"
                >
                  <Image
                    src="/assets/main-Photoroom.png"
                    alt="Brain Core"
                    fill
                    className="object-contain"
                    priority
                  />
                </motion.div>

                <motion.span
                  style={{ opacity: brainOpacity }}
                  className="mt-1 text-center font-mono text-[0.65rem] font-semibold tracking-widest text-muted/75 uppercase"
                >
                  Neural Processing Core
                </motion.span>
              </div>

              {/* 1. TOP-LEFT: Brain–Computer Interfaces */}
              <div className="absolute left-[5.5%] top-[1%] z-30">
                <NodeItem
                  pillar={PILLARS[0]}
                  onHover={() => setHoveredPillar(PILLARS[0])}
                  onLeave={() => setHoveredPillar(null)}
                  style={{ opacity: tlOpacity, x: tlX, y: tlY }}
                />
              </div>

              {/* 2. TOP-RIGHT: EEG Signal Processing */}
              <div className="absolute right-[5.5%] top-[1%] z-30">
                <NodeItem
                  pillar={PILLARS[1]}
                  onHover={() => setHoveredPillar(PILLARS[1])}
                  onLeave={() => setHoveredPillar(null)}
                  style={{ opacity: trOpacity, x: trX, y: trY }}
                />
              </div>

              {/* 3. BOTTOM-LEFT: Affective Computing */}
              <div className="absolute left-[5.5%] bottom-[2%] z-30">
                <NodeItem
                  pillar={PILLARS[2]}
                  onHover={() => setHoveredPillar(PILLARS[2])}
                  onLeave={() => setHoveredPillar(null)}
                  style={{ opacity: blOpacity, x: blX, y: blY }}
                />
              </div>

              {/* 4. BOTTOM-RIGHT: Machine Learning */}
              <div className="absolute right-[5.5%] bottom-[2%] z-30">
                <NodeItem
                  pillar={PILLARS[3]}
                  onHover={() => setHoveredPillar(PILLARS[3])}
                  onLeave={() => setHoveredPillar(null)}
                  style={{ opacity: brOpacity, x: brX, y: brY }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── MOBILE / TABLET VIEW ── */}
        <div className="lg:hidden">
          <div className="flex flex-col items-center text-center pb-4">
            <img
              src="/research_domain.png"
              alt="Our Research Domains"
              className="h-16 w-auto object-contain sm:h-20"
            />
          </div>

          <div className="mt-6 space-y-7">
            <Reveal>
              <div className="flex flex-col items-center text-center">
                <div className="relative w-56 h-44">
                  <Image
                    src="/assets/main-Photoroom.png"
                    alt="Brain Core"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted">
                  Neural Processing Core
                </p>
              </div>
            </Reveal>

            <div className="grid gap-5 sm:grid-cols-2">
              {PILLARS.map((pillar, i) => (
                <Reveal key={pillar.id} delay={i * 0.08}>
                  <Link
                    href="/research"
                    className="group block rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-xs transition-all hover:border-ink/30 hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-28 shrink-0">
                        <Image
                          src={pillar.image}
                          alt={pillar.title}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-[0.62rem] font-semibold text-muted uppercase">
                          Domain {pillar.number}
                        </span>
                        <h3 className="mt-0.5 text-sm font-semibold text-ink group-hover:text-navy-700">
                          {pillar.title}
                        </h3>
                        <ArrowUpRight weight="bold" className="mt-1 h-3.5 w-3.5 text-ink/30" />
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-muted">
                      {pillar.shortSummary}
                    </p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Individual Drawing Node */
function NodeItem({
  pillar,
  onHover,
  onLeave,
  style,
}: {
  pillar: Pillar;
  onHover: () => void;
  onLeave: () => void;
  style: any;
}) {
  return (
    <motion.div style={style} className="relative">
      <Link
        href="/research"
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        className="group block cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95"
      >
        {/* Standalone illustration sized to fit cleanly inside the whiteboard */}
        <div className="relative w-60 h-42 xl:w-72 xl:h-48 filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
          <Image
            src={pillar.image}
            alt={pillar.title}
            fill
            className="object-contain transition-opacity duration-200 group-hover:opacity-95"
          />
        </div>

        {/* Click indicator */}
        <div className="mt-1 text-center">
          <span className="inline-flex items-center gap-1 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-muted/80 group-hover:text-ink transition-colors">
            <span>Explore {pillar.title}</span>
            <ArrowUpRight weight="bold" className="h-3 w-3" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
