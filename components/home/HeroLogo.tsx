'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { cubicBezier, motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';

type Metrics = { vh: number; headerH: number; bigW: number };

/**
 * The hero logo. It starts large and centred, then travels up and shrinks into
 * the header's centre slot as the first screen scrolls away. Scroll-linked (no
 * scroll listeners of our own); with reduced motion it snaps instead of gliding.
 */
export default function HeroLogo({ src, alt }: { src: string; alt: string }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const reduce = useReducedMotion();
  const [metrics, setMetrics] = useState<Metrics>({ vh: 800, headerH: 76, bigW: 520 });

  useEffect(() => {
    const measure = () => {
      const header = document.querySelector('header');
      setMetrics({
        vh: window.innerHeight,
        headerH: header?.getBoundingClientRect().height ?? 76,
        bigW: imageRef.current?.offsetWidth ?? 520,
      });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const { scrollY } = useScroll();
  const smooth = useSpring(scrollY, { stiffness: 140, damping: 26, mass: 0.35 });

  const range = Math.max(metrics.vh * 0.85, 300);
  const smallW = Math.min(metrics.headerH * 0.74, 60);
  const endScale = smallW / metrics.bigW;
  const endY = -(metrics.vh / 2 - metrics.headerH / 2);
  const ease = cubicBezier(0.65, 0, 0.35, 1);

  const progress = useTransform(
    reduce ? scrollY : smooth,
    reduce ? [0, range * 0.5, range * 0.5 + 1] : [0, range],
    reduce ? [0, 0, 1] : [0, 1],
    reduce ? undefined : { ease },
  );
  const y = useTransform(progress, [0, 1], [0, endY]);
  const scale = useTransform(progress, [0, 1], [1, endScale]);
  const cueOpacity = useTransform(scrollY, [0, metrics.vh * 0.2], [1, 0]);
  const cueVisibility = useTransform(cueOpacity, (value) => (value > 0.02 ? 'visible' : 'hidden'));

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[55] h-0">
        <motion.div
          style={{ y, scale }}
          className="pointer-events-auto absolute left-1/2 top-[50svh] -translate-x-1/2 -translate-y-1/2 will-change-transform"
        >
          <Link href="/" aria-label="BrainX Lab home" className="block rounded-full focus-visible:outline-offset-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={src}
              alt={alt}
              width={560}
              height={567}
              className="h-auto w-[min(72vw,32rem)] select-none"
              draggable={false}
            />
          </Link>
        </motion.div>
      </div>

      <motion.a
        href="#who-we-are"
        style={{ opacity: cueOpacity, visibility: cueVisibility }}
        className="fixed bottom-6 left-1/2 z-[55] inline-flex min-h-11 -translate-x-1/2 flex-col items-center gap-1 px-4 font-mono text-[0.65rem] uppercase tracking-[0.24em] text-muted hover:text-ink"
      >
        Scroll
        <span aria-hidden className="h-8 w-px bg-gradient-to-b from-ink/50 to-transparent" />
      </motion.a>
    </>
  );
}
