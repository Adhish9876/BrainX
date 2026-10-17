'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'motion/react';
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

const EASE_SLOW = [0.12, 1, 0.2, 1] as const;

const titleVariants = {
  hidden: {
    opacity: 0,
    y: 44,
    transition: { duration: 1.2, ease: EASE_SLOW },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 2.4, ease: EASE_SLOW },
  },
};

const brainVariants = {
  hidden: {
    opacity: 0,
    scale: 0.84,
    y: 56,
    transition: { duration: 1.2, ease: EASE_SLOW },
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 2.5, ease: EASE_SLOW },
  },
};

const linesVariants = {
  hidden: {
    opacity: 0,
    transition: { duration: 1.0, ease: EASE_SLOW },
  },
  visible: {
    opacity: 0.45,
    transition: { duration: 2.5, ease: EASE_SLOW },
  },
};

const nodeVariants = {
  tl: {
    hidden: {
      opacity: 0,
      x: -44,
      y: 64,
      transition: { duration: 1.2, ease: EASE_SLOW },
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 2.5, ease: EASE_SLOW },
    },
  },
  tr: {
    hidden: {
      opacity: 0,
      x: 44,
      y: 64,
      transition: { duration: 1.2, ease: EASE_SLOW },
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 2.5, ease: EASE_SLOW },
    },
  },
  bl: {
    hidden: {
      opacity: 0,
      x: -44,
      y: 76,
      transition: { duration: 1.2, ease: EASE_SLOW },
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 2.5, ease: EASE_SLOW },
    },
  },
  br: {
    hidden: {
      opacity: 0,
      x: 44,
      y: 76,
      transition: { duration: 1.2, ease: EASE_SLOW },
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 2.5, ease: EASE_SLOW },
    },
  },
};

export default function WhatWeDo() {
  const [hoveredPillar, setHoveredPillar] = useState<Pillar | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  // Track when the section crosses a clear scroll threshold
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'start start'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    if (latest > 0.28 && !isUnlocked) {
      setIsUnlocked(true);
    } else if (latest <= 0.18 && isUnlocked) {
      setIsUnlocked(false);
    }
  });

  const animState = isUnlocked ? 'visible' : 'hidden';

  return (
    <section
      ref={containerRef}
      id="what-we-do"
      aria-labelledby="what-heading"
      className="relative isolate bg-white lg:bg-[#0b1020] min-h-[92svh] flex flex-col justify-center items-center py-6 md:py-10 border-t border-ink/10 lg:border-white/10 overflow-hidden"
    >
      {/* Soft brand-coloured light behind the board (desktop only) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden lg:block">
        <div className="absolute -left-40 top-1/4 h-[34rem] w-[34rem] rounded-full bg-sky-500/25 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[32rem] w-[32rem] rounded-full bg-orange-400/20 blur-[120px]" />
      </div>

      <div className="w-full flex items-center justify-center px-4 sm:px-8 lg:px-12">
        {/* ── DESKTOP WHITEBOARD CANVAS (Slightly smaller with generous framing) ── */}
        <div
          style={{ maxWidth: 'min(86vw, calc(82svh * 1672 / 941))' }}
          className="hidden lg:block relative mx-auto w-full aspect-[1672/941] select-none"
        >
          {/* Whiteboard background image in exact native aspect ratio */}
          {/* Solid white backing: the board photo is semi-transparent, so on the black page it would turn grey */}
          <div aria-hidden="true" className="absolute inset-x-[2.2%] top-[2.6%] bottom-[5%] rounded-[0.4rem] bg-white" />
          <Image
            src="/Board.png"
            alt=""
            fill
            priority
            sizes="90vw"
            className="pointer-events-none object-contain drop-shadow-[0_20px_40px_rgba(11,16,32,0.10)]"
          />

          {/* Inner whiteboard drawing surface (avoids silver frame & bottom marker tray) */}
          <div className="absolute inset-x-[4.5%] top-[2.5%] bottom-[8.5%]">
            {/* Title inside top of whiteboard */}
            <div className="flex flex-col items-center text-center">
              <h2 id="what-heading" className="sr-only">
                Our Research Domains
              </h2>
              <motion.div
                initial="hidden"
                animate={animState}
                variants={titleVariants}
              >
                <img
                  src="/research_domain_clean.png"
                  alt="Our Research Domains"
                  className="h-[2.9rem] w-auto object-contain xl:h-[3.4rem]"
                />
              </motion.div>
            </div>

            {/* Diagram area below title */}
            <div className="relative -mt-3 h-[calc(100%-3.2rem)] w-full">
              {/* Connecting Curved Guide Lines - Threshold Triggered */}
              <motion.svg
                initial="hidden"
                animate={animState}
                variants={linesVariants}
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 1000 560"
                fill="none"
                preserveAspectRatio="none"
              >
                {/* Top-Left: BCI */}
                <path
                  d="M 255 150 C 335 190, 420 235, 460 260"
                  stroke="#0284c7"
                  strokeWidth="2.4"
                  strokeDasharray="5 5"
                />
                {/* Top-Right: EEG */}
                <path
                  d="M 745 150 C 665 190, 580 235, 540 260"
                  stroke="#059669"
                  strokeWidth="2.4"
                  strokeDasharray="5 5"
                />
                {/* Bottom-Left: Affective */}
                <path
                  d="M 255 410 C 335 370, 420 325, 460 300"
                  stroke="#d97706"
                  strokeWidth="2.4"
                  strokeDasharray="5 5"
                />
                {/* Bottom-Right: ML */}
                <path
                  d="M 745 410 C 665 370, 580 325, 540 300"
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
                      className="pointer-events-none absolute top-12 left-[75%] -translate-x-1/2 -translate-y-full z-50 w-[250px] h-[250px] xl:w-[272px] xl:h-[272px] filter drop-shadow-[0_16px_36px_rgba(0,0,0,0.18)]"
                    >
                      <div className="relative w-full h-full">
                        <Image
                          src="/assets/bubble-clean.png"
                          alt="Thought Bubble"
                          fill
                          sizes="300px"
                          className="object-contain"
                          priority
                        />

                        <div className="absolute inset-x-12 top-8 bottom-[5.6rem] flex flex-col items-center justify-center text-center">
                          <h4 className="font-sans text-[0.8rem] font-bold leading-tight text-black max-w-[150px]">
                            {hoveredPillar.title}
                          </h4>

                          <p className="mt-1 font-sans text-[0.62rem] font-medium leading-snug text-black/90 max-w-[140px]">
                            {hoveredPillar.shortSummary}
                          </p>

                          <span className="mt-1.5 inline-flex items-center gap-1 font-mono text-[0.58rem] font-bold text-black/80">
                            <span>Click node to view</span>
                            <ArrowUpRight weight="bold" className="h-2 w-2" />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Central Brain Illustration - Threshold Triggered */}
                <motion.div
                  initial="hidden"
                  animate={animState}
                  variants={brainVariants}
                  className="flex flex-col items-center"
                >
                  <div className="relative w-[15rem] h-[12rem] xl:w-[17.5rem] xl:h-[14rem] 2xl:w-[19rem] 2xl:h-[15.2rem] filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
                    <Image
                      src="/assets/main-Photoroom.png"
                      alt="Brain Core"
                      fill
                      sizes="(min-width:1024px) 20vw, 60vw"
                      className="object-contain"
                      priority
                    />
                  </div>

                  <span className="mt-1 text-center font-mono text-[0.66rem] xl:text-[0.72rem] font-semibold tracking-widest text-muted/75 uppercase">
                    Neural Processing Core
                  </span>
                </motion.div>
              </div>

              {/* 1. TOP-LEFT: Brain–Computer Interfaces */}
              <div className="absolute left-[2.5%] top-[0%] z-30">
                <NodeItem
                  pillar={PILLARS[0]}
                  onHover={() => setHoveredPillar(PILLARS[0])}
                  onLeave={() => setHoveredPillar(null)}
                  animState={animState}
                  variants={nodeVariants.tl}
                />
              </div>

              {/* 2. TOP-RIGHT: EEG Signal Processing */}
              <div className="absolute right-[2.5%] top-[0%] z-30">
                <NodeItem
                  pillar={PILLARS[1]}
                  onHover={() => setHoveredPillar(PILLARS[1])}
                  onLeave={() => setHoveredPillar(null)}
                  animState={animState}
                  variants={nodeVariants.tr}
                />
              </div>

              {/* 3. BOTTOM-LEFT: Affective Computing */}
              <div className="absolute left-[2.5%] bottom-[0.5%] z-30">
                <NodeItem
                  pillar={PILLARS[2]}
                  onHover={() => setHoveredPillar(PILLARS[2])}
                  onLeave={() => setHoveredPillar(null)}
                  animState={animState}
                  variants={nodeVariants.bl}
                />
              </div>

              {/* 4. BOTTOM-RIGHT: Machine Learning */}
              <div className="absolute right-[2.5%] bottom-[0.5%] z-30">
                <NodeItem
                  pillar={PILLARS[3]}
                  onHover={() => setHoveredPillar(PILLARS[3])}
                  onLeave={() => setHoveredPillar(null)}
                  animState={animState}
                  variants={nodeVariants.br}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── MOBILE / TABLET VIEW ── */}
        <div className="lg:hidden w-full max-w-[76rem] mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center text-center pb-4">
            <img
              src="/research_domain_clean.png"
              alt="Our Research Domains"
              className="h-9 w-auto object-contain sm:h-11"
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
                    sizes="(min-width:1024px) 20vw, 60vw"
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
                          sizes="(min-width:1024px) 22vw, 60vw"
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
  animState,
  variants,
}: {
  pillar: Pillar;
  onHover: () => void;
  onLeave: () => void;
  animState: 'hidden' | 'visible';
  variants: any;
}) {
  return (
    <motion.div
      initial="hidden"
      animate={animState}
      variants={variants}
      className="relative will-change-transform"
    >
      <Link
        href="/research"
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        className="group block cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95"
      >
        {/* Standalone illustration sized to fit cleanly inside the whiteboard */}
        <div className="relative w-[17rem] h-[11.8rem] xl:w-[20rem] xl:h-[13.9rem] 2xl:w-[22rem] 2xl:h-[15.4rem] filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
          <Image
            src={pillar.image}
            alt={pillar.title}
            fill
            sizes="(min-width:1024px) 22vw, 60vw"
            className="object-contain transition-opacity duration-200 group-hover:opacity-95"
          />
        </div>

        {/* Click indicator */}
        <div className="mt-1 text-center">
          <span className="inline-flex items-center gap-1 font-mono text-[0.68rem] xl:text-[0.74rem] font-semibold uppercase tracking-wider text-muted/80 group-hover:text-ink transition-colors">
            <span>Explore {pillar.title}</span>
            <ArrowUpRight weight="bold" className="h-3 w-3" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

