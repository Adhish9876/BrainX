'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import DriftWall, { type DriftWallItem } from '@/components/ui/DriftWall';
import type { PictureGroup } from '@/lib/types';

const MIN_WALL_TILES = 15;

function buildWallItems(pictures: PictureGroup[]): DriftWallItem[] | undefined {
  // Ignore the two built-in placeholder demo groups unless the user renames them or adds real groups
  const realGroups = pictures.filter((group) => !/placeholder/i.test(group.name));
  const rawItems: DriftWallItem[] = [];

  for (const group of realGroups) {
    for (const image of group.images) {
      rawItems.push({
        image,
        title: group.name,
        subtitle: group.date || group.description || undefined,
      });
    }
  }

  if (rawItems.length === 0) return undefined;

  const filled: DriftWallItem[] = [...rawItems];
  while (filled.length < MIN_WALL_TILES) {
    filled.push(rawItems[filled.length % rawItems.length]);
  }
  return filled;
}

export default function LabLife({ pictures = [] }: { pictures?: PictureGroup[] }) {
  const customItems = buildWallItems(pictures);
  const sectionRef = useRef<HTMLElement>(null);

  // Smooth scroll progression: starts slowly as section enters, fully appears by ~1/3 of screen
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 92%', 'start 35%'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    restDelta: 0.001,
  });

  const headerOpacity = useTransform(smoothProgress, [0.08, 0.85], [0, 1]);
  const headerY = useTransform(smoothProgress, [0.08, 0.85], [36, 0]);

  const wallOpacity = useTransform(smoothProgress, [0.2, 0.95], [0, 1]);
  const wallScale = useTransform(smoothProgress, [0.2, 0.95], [0.94, 1]);

  return (
    <section
      ref={sectionRef}
      id="gallery"
      aria-labelledby="gallery-heading"
      className="border-t border-ink/10 bg-white pb-20 pt-8 md:pb-28 md:pt-10 overflow-hidden"
    >
      <div className="shell">
        {/* Header */}
        <motion.div
          style={{ opacity: headerOpacity, y: headerY }}
          className="flex items-end justify-between gap-8 border-b border-ink/10 pb-6"
        >
          <div>
            <h2
              id="gallery-heading"
              className="font-display text-[2.4rem] leading-[1.05] tracking-[-0.02em] text-ink sm:text-5xl"
            >
              Life in the lab.
            </h2>
          </div>

          <Link
            href="/pictures"
            className="group hidden items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink md:flex"
          >
            All pictures
            <ArrowUpRight
              weight="bold"
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </Link>
        </motion.div>

        {/* Mobile CTA */}
        <motion.div style={{ opacity: headerOpacity }} className="md:hidden">
          <Link
            href="/pictures"
            className="group mt-4 inline-flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
          >
            All pictures
            <ArrowUpRight weight="bold" className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </motion.div>
      </div>

      {/* 3D DriftWall stage */}
      <motion.div
        style={{ opacity: wallOpacity, scale: wallScale }}
        className="relative mx-auto mt-4 h-[600px] w-full max-w-[1640px] px-2 md:h-[680px] md:px-6"
      >
        <DriftWall
          items={customItems}
          columns={5}
          tileWidth={260}
          tileHeight={172}
          gap={18}
          tilt={16}
          turn={-14}
          perspective={1200}
          depth={120}
          speed={42}
          direction="up"
          variance={0.45}
          parallax={0.6}
          lift={64}
          fade={0}
          dim={1}
          overlayColor="transparent"
        />
      </motion.div>
    </section>
  );
}
