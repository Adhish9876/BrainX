'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import Reveal from './Reveal';
import type { Partner } from '@/lib/types';

const TINTS = [
  'from-sky-100 via-sky-50 to-white',
  'from-orange-100 via-orange-50 to-white',
  'from-indigo-100 via-indigo-50 to-white',
  'from-teal-100 via-teal-50 to-white',
];

type ViewPartner = Partner & { tint: string };

function Logo({ partner, className = '' }: { partner: ViewPartner; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  const img = (
    <img
      src={partner.logo}
      alt={partner.name}
      draggable={false}
      className={`w-auto object-contain ${className}`}
    />
  );
  if (!partner.link) return img;
  return (
    <a
      href={partner.link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${partner.name} (opens in a new tab)`}
      className="group/logo inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-600"
    >
      {img}
      <ArrowUpRight
        className="h-4 w-4 text-slate-400 transition-transform group-hover/logo:-translate-y-0.5 group-hover/logo:translate-x-0.5"
        aria-hidden
      />
    </a>
  );
}

function ProductImage({ partner, className = '' }: { partner: ViewPartner; className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Soft colour wash that melts into the page: no box, no edges */}
      <div
        aria-hidden="true"
        className={`absolute left-1/2 top-1/2 h-[85%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br ${partner.tint} opacity-90 blur-3xl`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={partner.product}
        alt={partner.productName || `${partner.name} equipment`}
        loading="lazy"
        draggable={false}
        style={{
          maskImage: 'radial-gradient(closest-side, #000 78%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(closest-side, #000 78%, transparent 100%)',
        }}
        className="relative h-full w-auto max-w-full object-contain mix-blend-multiply"
      />
    </div>
  );
}

function Description({ partner }: { partner: ViewPartner }) {
  if (!partner.productName && !partner.description) return null;
  return (
    <div className="text-center">
      {partner.productName ? (
        <h3 className="font-display text-xl font-bold tracking-tight text-[#1d1d1f]">{partner.productName}</h3>
      ) : null}
      {partner.description ? (
        <p className="mx-auto mt-2 max-w-md text-[0.95rem] leading-relaxed text-[#424245]">{partner.description}</p>
      ) : null}
    </div>
  );
}


const EASE = [0.22, 1, 0.36, 1] as const;
/** Scroll progress at which each stage is reached. Crossing one plays that stage at a fixed speed. */
const STAGE_AT = [0.04, 0.14, 0.28, 0.45, 0.66];

/** A thin connector that draws itself when its stage is reached (fixed speed, not scroll-speed dependent). */
function Line({
  stage,
  at,
  axis = 'y',
  className = '',
  style,
}: {
  stage: number;
  at: number;
  axis?: 'x' | 'y';
  className?: string;
  style?: React.CSSProperties;
}) {
  const shown = stage >= at;
  return (
    <motion.div
      aria-hidden="true"
      initial={false}
      animate={axis === 'y' ? { scaleY: shown ? 1 : 0 } : { scaleX: shown ? 1 : 0 }}
      transition={{ duration: 0.45, delay: shown ? (at - 1) * 0.12 : 0, ease: EASE }}
      style={{ transformOrigin: axis === 'y' ? '50% 0%' : '50% 50%', ...style }}
      className={`bg-slate-400/70 ${axis === 'y' ? 'w-px' : 'h-px'} ${className}`}
    />
  );
}

/**
 * Desktop, Apple-style: the section pins with the title large and centred. Scrolling advances it through
 * stages (title settles, branches, logos, photos, text). Each stage plays at its own fixed, smooth speed,
 * so a fast scroll never skips or rushes the effect; it simply plays the remaining stages in order.
 */
function FlowChart({ partners }: { partners: ViewPartner[] }) {
  const ref = useRef<HTMLElement | null>(null);
  const [stage, setStage] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 96px', 'end end'] });
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const next = STAGE_AT.filter((t) => v >= t).length;
    setStage((cur) => (cur === next ? cur : next));
  });

  const reveal = (at: number, y = 22, scale = 1) => ({
    initial: false as const,
    animate: stage >= at ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y, scale },
    transition: { duration: 0.7, delay: stage >= at ? (at - 1) * 0.12 : 0, ease: EASE },
  });

  return (
    <section
      ref={ref}
      aria-labelledby="partners-heading"
      className="relative hidden h-[150svh] border-t border-[#e0e0e0] bg-white lg:block"
    >
      <div className="sticky top-24 flex h-[calc(100svh-6rem)] flex-col items-center overflow-hidden px-6 pt-8">
        <motion.div
          initial={false}
          animate={stage >= 1 ? { y: '0svh', scale: 1 } : { y: '26svh', scale: 1.7 }}
          transition={{ duration: 0.8, ease: EASE }}
          style={{ transformOrigin: '50% 0%' }}
          className="relative z-10 text-center"
        >
          <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.2em] text-navy-700">
            Research infrastructure
          </p>
          <h2
            id="partners-heading"
            className="mt-2 font-display text-4xl font-extrabold tracking-tight text-[#1d1d1f] lg:text-5xl"
          >
            Our equipment partners
          </h2>
        </motion.div>

        <Line stage={stage} at={2} className="mt-5 h-8" />

        <div className="relative w-full max-w-5xl">
          {partners.length > 1 && (
            <Line
              stage={stage}
              at={2}
              axis="x"
              className="absolute top-0"
              style={{ left: `${50 / partners.length}%`, right: `${50 / partners.length}%` }}
            />
          )}

          <div className="grid" style={{ gridTemplateColumns: `repeat(${partners.length}, minmax(0, 1fr))` }}>
            {partners.map((partner, index) => (
              <div key={`${partner.name}-${index}`} className="flex flex-col items-center">
                <Line stage={stage} at={3} className="h-8" />

                <motion.div {...reveal(3, 16)} className="mt-3">
                  <Logo partner={partner} className="h-14 max-w-[16rem]" />
                </motion.div>

                <Line stage={stage} at={4} className="mt-3 h-8" />

                <motion.div {...reveal(4, 36, 0.94)} className="mt-1 w-full">
                  <ProductImage partner={partner} className="mx-auto h-[min(38svh,25rem)] w-full" />
                </motion.div>

                <motion.div {...reveal(5, 16)} className="mt-4 min-h-12 w-full">
                  <Description partner={partner} />
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Phones and tablets: a simple stack (logo first, so the equipment is always labelled). */
function Stacked({ partners }: { partners: ViewPartner[] }) {
  return (
    <section
      aria-labelledby="partners-heading-m"
      className="relative border-t border-[#e0e0e0] bg-white py-14 lg:hidden"
    >
      <div className="shell">
        <Reveal>
          <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.2em] text-navy-700">
            Research infrastructure
          </p>
          <h2
            id="partners-heading-m"
            className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#1d1d1f] sm:text-4xl"
          >
            Our equipment partners
          </h2>
        </Reveal>

        <div className="mt-10 space-y-14">
          {partners.map((partner, index) => (
            <Reveal key={`${partner.name}-${index}`} y={20}>
              <div className="flex flex-col items-center text-center">
                <Logo partner={partner} className="h-12 max-w-[14rem]" />
                <div className="my-3 h-6 w-px bg-slate-300" aria-hidden="true" />
                <ProductImage partner={partner} className="h-60 w-full sm:h-72" />
                <div className="mt-4 w-full">
                  <Description partner={partner} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Partners({ partners }: { partners: Partner[] }) {
  const items: ViewPartner[] = partners
    .filter((partner) => partner.name || partner.logo || partner.product)
    .map((partner, index) => ({ ...partner, tint: TINTS[index % TINTS.length] }));
  if (items.length === 0) return null;
  return (
    <>
      <FlowChart partners={items} />
      <Stacked partners={items} />
    </>
  );
}
