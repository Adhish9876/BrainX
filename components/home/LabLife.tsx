import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import ImagePlaceholder from './ImagePlaceholder';
import Reveal from './Reveal';
import SectionIntro from './SectionIntro';

export default function LabLife() {
  return (
    <section id="gallery" aria-labelledby="gallery-heading" className="bg-paper pb-28 pt-24 md:pb-36 md:pt-32">
      <div className="shell">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <Reveal>
            <SectionIntro index="05" label="Gallery" id="gallery-heading" title="Life in the lab." />
          </Reveal>
          <Reveal delay={0.08}>
            <Link
              href="/pictures"
              className="group inline-flex min-h-11 items-center gap-2 text-[0.95rem] font-medium text-ink underline-offset-8 hover:underline"
            >
              Browse all pictures
              <ArrowRight
                weight="bold"
                className="h-4 w-4 text-crimson-600 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-12 md:items-end">
          <Reveal className="md:col-span-5">
            <ImagePlaceholder label="Lab photograph" aspect="aspect-[4/5]" />
          </Reveal>
          <Reveal delay={0.08} className="md:col-span-4">
            <ImagePlaceholder label="Lab photograph" aspect="aspect-square" tone="warm" />
          </Reveal>
          <Reveal delay={0.16} className="md:col-span-3">
            <ImagePlaceholder label="Lab photograph" aspect="aspect-[3/4]" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
