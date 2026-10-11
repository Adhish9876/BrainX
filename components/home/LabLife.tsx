import Link from 'next/link';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import DriftWall, { type DriftWallItem } from '@/components/ui/DriftWall';
import type { PictureGroup } from '@/lib/types';
import Reveal from './Reveal';

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

  return (
    <section
      id="gallery"
      aria-labelledby="gallery-heading"
      className="border-t border-ink/10 bg-paper pb-20 pt-8 md:pb-28 md:pt-10"
    >
      <div className="shell">
        {/* Header */}
        <div className="flex items-end justify-between gap-8 border-b border-ink/10 pb-6">
          <Reveal>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-muted">
              04 — Gallery
            </p>
            <h2
              id="gallery-heading"
              className="mt-3 font-display text-[2.4rem] leading-[1.05] tracking-[-0.02em] text-ink sm:text-5xl"
            >
              Life in the lab.
            </h2>
          </Reveal>

          <Reveal delay={0.08}>
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
          </Reveal>
        </div>

        {/* Mobile CTA */}
        <Reveal delay={0.2}>
          <Link
            href="/pictures"
            className="group mt-4 inline-flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink md:hidden"
          >
            All pictures
            <ArrowUpRight weight="bold" className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </Reveal>
      </div>

      {/* 3D DriftWall stage */}
      <div className="relative mx-auto mt-4 h-[600px] w-full max-w-[1640px] px-2 md:h-[680px] md:px-6">
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
          fade={0.55}
          dim={0.85}
          overlayColor="#f6f8fa"
        />
      </div>
    </section>
  );
}
