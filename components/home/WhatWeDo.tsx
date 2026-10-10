import type { ComponentType } from 'react';
import Link from 'next/link';
import { ArrowRight, Brain, Cpu, Heartbeat, Pulse, Waveform } from '@phosphor-icons/react/dist/ssr';
import type { IconProps } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import ImagePlaceholder from './ImagePlaceholder';
import Reveal from './Reveal';
import SectionIntro from './SectionIntro';

type Detail = { Icon: ComponentType<IconProps>; description: string };

// Neutral, field-level definitions — not claims about the lab's results.
function detailFor(area: string): Detail {
  const key = area.toLowerCase();
  if (/brain|bci|interface/.test(key)) {
    return { Icon: Brain, description: 'Systems that translate brain activity into commands or communication for external devices.' };
  }
  if (/eeg|signal/.test(key)) {
    return { Icon: Waveform, description: 'Cleaning, decomposing and decoding the electrical activity recorded from the scalp.' };
  }
  if (/affect|emotion/.test(key)) {
    return { Icon: Heartbeat, description: 'Computing that recognises and responds to human emotion from physiological signals.' };
  }
  if (/machine|learning|\bml\b/.test(key)) {
    return { Icon: Cpu, description: 'Learning-based models that turn noisy biosignals into reliable predictions.' };
  }
  return { Icon: Pulse, description: '' };
}

export default function WhatWeDo({ areas }: { areas: string[] }) {
  if (areas.length === 0) return null;

  return (
    <section
      id="what-we-do"
      aria-labelledby="what-heading"
      className="border-y border-ink/10 bg-white py-24 md:py-32"
    >
      <div className="shell">
        <Reveal>
          <SectionIntro index="02" label="What we do" id="what-heading" title="Four connected areas of research." />
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-12 lg:gap-8">
          <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {areas.map((area, index) => {
              const { Icon, description } = detailFor(area);
              const warm = index % 2 === 1;
              return (
                <li key={area}>
                  <Reveal delay={index * 0.07} className="h-full">
                    <article className="group flex h-full flex-col rounded-3xl border border-ink/10 bg-paper p-7 transition-all duration-300 hover:-translate-y-1 hover:border-ink/25 hover:shadow-[0_24px_40px_-28px_rgba(11,16,32,0.4)]">
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'grid h-12 w-12 place-items-center rounded-2xl',
                            warm ? 'bg-crimson-100 text-crimson-600' : 'bg-navy-100 text-navy-700',
                          )}
                        >
                          <Icon weight="duotone" className="h-6 w-6" aria-hidden />
                        </span>
                        <span className="font-mono text-xs text-muted">{String(index + 1).padStart(2, '0')}</span>
                      </div>
                      <h3 className="mt-8 font-display text-[1.7rem] leading-tight text-ink">{area}</h3>
                      {description ? (
                        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{description}</p>
                      ) : null}
                    </article>
                  </Reveal>
                </li>
              );
            })}
          </ul>

          <Reveal delay={0.15} className="lg:col-span-5">
            <ImagePlaceholder
              label="Research in practice"
              aspect="aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-[28rem]"
              tone="warm"
              className="h-full"
            />
          </Reveal>
        </div>

        <Link
          href="/research"
          className="group mt-10 inline-flex min-h-11 items-center gap-2 text-[0.95rem] font-medium text-ink underline-offset-8 hover:underline"
        >
          Explore research themes
          <ArrowRight
            weight="bold"
            className="h-4 w-4 text-crimson-600 transition-transform group-hover:translate-x-1"
            aria-hidden
          />
        </Link>
      </div>
    </section>
  );
}
