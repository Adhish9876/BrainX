import type { Metadata } from 'next';
import Reveal from '@/components/home/Reveal';
import Gallery from '@/components/public/Gallery';
import { getContent } from '@/lib/content';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Pictures',
  description: 'Photographs and moments from BrainX Lab.',
};

export default function PicturesPage() {
  const { pictures } = getContent();

  return (
    <div className="relative isolate overflow-x-clip bg-white">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate -mt-22 overflow-hidden pt-22 md:-mt-24 md:pt-24">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pictures_bg.png"
            alt=""
            draggable={false}
            className="h-full w-full object-cover object-left opacity-60 saturate-[0.85]"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
        </div>

        <div className="shell pb-2 pt-4 sm:pb-3 sm:pt-6 md:pb-4 md:pt-8">
          <Reveal>
            <h1 className="max-w-4xl font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-[#1d1d1f] sm:text-6xl lg:text-7xl">
              Moments from the lab.
            </h1>
          </Reveal>
        </div>
      </section>

      <div className="pb-24 md:pb-28">
        <Gallery groups={pictures} />
      </div>
    </div>
  );
}
