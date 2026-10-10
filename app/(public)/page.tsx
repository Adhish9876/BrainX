import Image from 'next/image';
import type { CSSProperties } from 'react';
import HeroLogo from '@/components/home/HeroLogo';
import LabLife from '@/components/home/LabLife';
import Latest, { type FeedItem } from '@/components/home/Latest';
import MotionProvider from '@/components/home/MotionProvider';
import People from '@/components/home/People';
import WhatWeDo from '@/components/home/WhatWeDo';
import WhoWeAre from '@/components/home/WhoWeAre';
import { formatDate } from '@/components/public/format';
import { HERO_IMAGE } from '@/components/public/hero.config';
import { getContent } from '@/lib/content';

export const dynamic = 'force-static';

const photoStyle = {
  '--hero-pos-sm': HERO_IMAGE.positionMobile,
  '--hero-pos-lg': HERO_IMAGE.positionDesktop,
} as CSSProperties;

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

export default function HomePage() {
  const { site, news, publications, team } = getContent();

  const areas = site.focus
    .split(',')
    .map((area) => area.trim())
    .filter(Boolean);
  const principal = team.find((member) => member.role === 'Principal Investigator');

  const publicationItems: FeedItem[] = [...publications]
    .sort((a, b) => b.year - a.year)
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      meta: String(item.year),
      title: item.title,
      detail: item.venue,
      href: item.link || '/publications',
      external: Boolean(item.link),
    }));

  const newsItems: FeedItem[] = [...news]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      meta: formatDate(item.date),
      title: item.title,
      detail: item.description ? clip(item.description, 140) : undefined,
      href: item.link || '/events?tab=news',
      external: Boolean(item.link),
    }));

  return (
    <MotionProvider>
      {/* -mb-24 cancels the footer's top margin; the last section carries its own spacing. */}
      <div className="-mb-24">
        <section
          id="hero"
          aria-labelledby="hero-heading"
          className="relative isolate -mt-[var(--header-h)] min-h-[100svh] overflow-hidden bg-paper"
        >
          <span id="hero-top" aria-hidden className="absolute left-0 top-6 h-px w-px" />
          {HERO_IMAGE.isPlaceholder ? (
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-[radial-gradient(55%_50%_at_70%_15%,rgba(74,124,247,0.13),transparent_70%),radial-gradient(50%_45%_at_15%_95%,rgba(207,67,48,0.12),transparent_70%),linear-gradient(180deg,#ffffff,#f6f3ee)]"
            />
          ) : (
            <>
              <Image
                src={HERO_IMAGE.src}
                alt=""
                fill
                priority
                sizes="100vw"
                className="hero-photo -z-10 object-cover"
                style={photoStyle}
              />
              <div aria-hidden className="absolute inset-0 -z-10 bg-white/55" />
            </>
          )}
          <h1 id="hero-heading" className="sr-only">
            {site.name}, {site.institution}
          </h1>
        </section>
        {site.logo ? <HeroLogo src={site.logo} alt={`${site.name} logo`} /> : null}

        <WhoWeAre site={site} principal={principal} areas={areas} />
        <WhatWeDo areas={areas} />
        <People team={team} />
        <Latest publications={publicationItems} news={newsItems} />
        <LabLife />
      </div>
    </MotionProvider>
  );
}
