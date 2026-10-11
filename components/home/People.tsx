import Link from 'next/link';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import type { Member } from '@/lib/types';
import Reveal from './Reveal';

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

export default function People({ team }: { team: Member[] }) {
  if (team.length === 0) return null;

  const principal = team.find((m) => m.role === 'Principal Investigator');

  return (
    <section
      id="people"
      aria-labelledby="people-heading"
      className="relative isolate overflow-hidden bg-paper pt-6 pb-0 md:pt-8"
    >
      {/* Right decorative contour background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/rightbg.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none select-none absolute -right-28 top-0 -z-10 h-full w-auto max-w-[70vw] object-cover object-right mix-blend-multiply opacity-90 sm:-right-36 lg:-right-48"
      />

      <div className="shell">
        {/* Eyebrow + title */}
        <Reveal>
          <div className="mb-8 flex items-center gap-6">
            <span className="h-px flex-1 bg-ink/10" />
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-muted">
              03 — People
            </span>
            <span className="h-px w-10 bg-ink/10" />
          </div>
        </Reveal>

        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
          {/* Left — PI profile */}
          {principal && (
            <div className="pb-8 lg:pb-12">
              <Reveal>
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.24em] text-crimson-600">
                  Principal Investigator
                </p>
                <h2
                  id="people-heading"
                  className="mt-3 font-display text-[3rem] leading-[1.0] tracking-[-0.025em] text-ink lg:text-[4rem]"
                >
                  {principal.name}
                </h2>
                {principal.position && (
                  <p className="mt-2 font-mono text-[0.78rem] text-muted">{principal.position}</p>
                )}
              </Reveal>

              {principal.description && (
                <Reveal delay={0.1}>
                  <p className="mt-8 max-w-prose text-[1rem] leading-[1.8] text-ink/75">
                    {clip(principal.description, 380)}
                  </p>
                </Reveal>
              )}

              {/* Expertise tags */}
              {principal.tags.length > 0 && (
                <Reveal delay={0.16}>
                  <div className="mt-8 flex flex-wrap gap-2">
                    {principal.tags.map((tag) => (
                      <span
                        key={tag}
                        className="border border-ink/10 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-ink/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Reveal>
              )}

              <Reveal delay={0.22}>
                <Link
                  href="/team"
                  className="group mt-10 inline-flex items-center gap-2.5 border border-ink/15 px-5 py-3 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-ink transition-all hover:bg-ink hover:text-white"
                >
                  Full team
                  <ArrowUpRight
                    weight="bold"
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden
                  />
                </Link>
              </Reveal>
            </div>
          )}

          {/* Right — PI portrait anchored flush to the bottom border */}
          <Reveal delay={0.14} className="flex items-end justify-center self-end lg:justify-start lg:pl-4">
            <img
              src="/kan.png"
              alt={principal?.name ?? 'Principal Investigator'}
              className="block max-h-[540px] w-auto object-contain object-bottom md:max-h-[640px] lg:max-h-[680px]"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
