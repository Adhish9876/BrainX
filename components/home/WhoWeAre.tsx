import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import type { Member, Site } from '@/lib/types';
import ImagePlaceholder from './ImagePlaceholder';
import Reveal from './Reveal';
import SectionIntro from './SectionIntro';

export default function WhoWeAre({
  site,
  principal,
  areas,
}: {
  site: Site;
  principal?: Member;
  areas: string[];
}) {
  const splitAt = site.about.indexOf('. We ');
  const lead = splitAt > 0 ? site.about.slice(0, splitAt + 1) : site.about;
  const rest = splitAt > 0 ? site.about.slice(splitAt + 2) : '';

  const facts: Array<[string, string]> = [
    ['Institution', site.institution],
    ['Department', 'Computer Science and Engineering'],
  ];
  if (principal) facts.push(['Principal investigator', principal.name]);

  return (
    <section
      id="who-we-are"
      aria-labelledby="who-heading"
      className="relative flex min-h-[100svh] items-center rounded-t-[2.5rem] bg-paper py-24 md:py-28"
    >
      <div className="shell grid items-center gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <Reveal>
            <SectionIntro
              index="01"
              label="Who we are"
              id="who-heading"
              title="Understanding the brain, building the interface."
            />
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-8 text-xl leading-relaxed text-ink">{lead}</p>
            {rest ? <p className="mt-4 text-base leading-relaxed text-muted">{rest}</p> : null}
          </Reveal>

          <Reveal delay={0.14}>
            <dl className="mt-10 grid gap-x-8 gap-y-5 border-t border-ink/10 pt-8 sm:grid-cols-2">
              {facts.map(([term, value]) => (
                <div key={term}>
                  <dt className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">{term}</dt>
                  <dd className="mt-1.5 text-[0.95rem] font-medium text-ink">{value}</dd>
                </div>
              ))}
              {areas.length > 0 ? (
                <div className="sm:col-span-2">
                  <dt className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                    Focus areas
                  </dt>
                  <dd className="mt-2.5 flex flex-wrap gap-2">
                    {areas.map((area) => (
                      <span
                        key={area}
                        className="rounded-full border border-ink/15 bg-white px-3.5 py-1.5 text-sm text-ink"
                      >
                        {area}
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
            <Link
              href="/research"
              className="group mt-8 inline-flex min-h-11 items-center gap-2 text-[0.95rem] font-medium text-ink underline-offset-8 hover:underline"
            >
              Read about our research
              <ArrowRight
                weight="bold"
                className="h-4 w-4 text-crimson-600 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="lg:col-span-6">
          <div className="grid grid-cols-5 gap-4">
            <ImagePlaceholder
              label="Lab photograph"
              aspect="aspect-[3/4]"
              className="col-span-3 row-span-2 h-full"
            />
            <ImagePlaceholder label="EEG setup" aspect="aspect-square" tone="warm" className="col-span-2" />
            <ImagePlaceholder label="Team at work" aspect="aspect-square" className="col-span-2" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
