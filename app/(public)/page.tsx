import HeroLogo from '@/components/home/HeroLogo';
import LabLife from '@/components/home/LabLife';
import MotionProvider from '@/components/home/MotionProvider';
import Partners from '@/components/home/Partners';
import WhatWeDo from '@/components/home/WhatWeDo';
import WhoWeAre from '@/components/home/WhoWeAre';
import { getContent } from '@/lib/content';

export const dynamic = 'force-static';

/** Digit/comma layout for the rolling counter, using Indian grouping (1,50,00,000). */
function grantStat(amount: number) {
  const text = amount.toLocaleString('en-IN');
  const digits = text.replace(/,/g, '').length;
  let remaining = digits;
  const places = [...text].map((ch) => (ch === ',' ? ',' : 10 ** --remaining));
  return { label: 'Grant funding', prefix: '₹', value: amount, suffix: '+', places };
}

export default function HomePage() {
  const { site, news, events, publications, team, pictures, projects } = getContent();
  const peopleCount = new Set(team.map((member) => member.name.trim().toLowerCase())).size;

  const areas = site.focus
    .split(',')
    .map((area) => area.trim())
    .filter(Boolean);
  const principal = team.find((member) => member.role === 'Principal Investigator');

  return (
    <MotionProvider>
      <div className="relative -mt-16 sm:-mt-20 md:-mt-24">
        <span id="hero-top" aria-hidden className="pointer-events-none absolute left-0 top-6 h-px w-px" />
        <section
          id="hero"
          aria-labelledby="hero-heading"
          className="relative isolate bg-[#05060a] h-svh min-h-[580px] flex items-center justify-center z-10 overflow-hidden"
        >
          {/* Ambient Neural Canvas */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden">
            {/* Deep Cosmic Base */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#040508] via-[#070b14] to-[#040508]" />

            {/* Central Neural Aura Glow (Matching BrainX logo palette: Electric Cyan + Sunset Coral) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[min(110vw,52rem)] w-[min(110vw,52rem)] rounded-full bg-[radial-gradient(circle_at_48%_48%,rgba(0,180,216,0.18)_0%,rgba(0,119,182,0.13)_32%,rgba(249,115,22,0.08)_52%,transparent_70%)] blur-3xl" />

            {/* Subtle secondary ambient glows */}
            <div className="absolute left-1/4 top-1/3 h-80 w-80 rounded-full bg-[#0077b6]/15 blur-[110px]" />
            <div className="absolute right-1/4 bottom-1/3 h-72 w-72 rounded-full bg-[#f97316]/10 blur-[100px]" />

            {/* Fine Cybernetic Neural Dot Matrix */}
            <div
              className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:28px_28px] opacity-75"
              style={{
                maskImage: 'radial-gradient(ellipse 65% 55% at 50% 50%, black 25%, transparent 85%)',
                WebkitMaskImage: 'radial-gradient(ellipse 65% 55% at 50% 50%, black 25%, transparent 85%)',
              }}
            />

            {/* Ethereal Neural Resonance Rings */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[34rem] w-[34rem] rounded-full border border-sky-500/10 [mask-image:radial-gradient(circle,black_50%,transparent_90%)]" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[48rem] w-[48rem] rounded-full border border-sky-400/5 [mask-image:radial-gradient(circle,black_50%,transparent_90%)]" />
          </div>

          <h1 id="hero-heading" className="sr-only">
            {site.name}, {site.institution}
          </h1>
          {site.logo ? <HeroLogo src={site.logo} alt={`${site.name} logo`} /> : null}
        </section>

        <div className="relative z-10 bg-[#f5f5f7]">
          <WhoWeAre
            site={site}
            principal={principal}
            areas={areas}
            news={news}
            events={events}
            publications={publications}
            pictures={pictures}
            stats={[
              { label: 'Publications', value: publications.length },
              { label: 'People', value: peopleCount },
              ...(site.grantAmount && site.grantAmount > 0 ? [grantStat(site.grantAmount)] : []),
              { label: 'Projects', value: projects.length },
            ].filter((stat) => stat.value > 0)}
          />
          <WhatWeDo />
          <Partners partners={site.partners ?? []} />
          <LabLife pictures={pictures} />
        </div>
      </div>
    </MotionProvider>
  );
}
