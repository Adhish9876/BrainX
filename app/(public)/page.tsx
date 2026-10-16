import Image from 'next/image';
import type { CSSProperties } from 'react';
import HeroLogo from '@/components/home/HeroLogo';
import LabLife from '@/components/home/LabLife';
import MotionProvider from '@/components/home/MotionProvider';
import Partners from '@/components/home/Partners';
import WhatWeDo from '@/components/home/WhatWeDo';
import WhoWeAre from '@/components/home/WhoWeAre';
import { HERO_IMAGE } from '@/components/public/hero.config';
import { getContent } from '@/lib/content';

export const dynamic = 'force-static';

const photoStyle = {
  '--hero-pos-sm': HERO_IMAGE.positionMobile,
  '--hero-pos-lg': HERO_IMAGE.positionDesktop,
} as CSSProperties;

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
      {/* Reload while scrolled down: the browser restores the scroll position after first paint, so the
          "Pioneering…" section would flash in its parked-below state. Remember the scroll position and
          pre-place the section before the first paint. */}
      <style>{`html.bx-restored #who-we-are > div { transform: none !important; }`}</style>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var d=document.documentElement;addEventListener('pagehide',function(){sessionStorage.setItem('bx-home-sy',String(window.scrollY))});var n=performance.getEntriesByType('navigation')[0];var r=n&&(n.type==='reload'||n.type==='back_forward');if(r&&Number(sessionStorage.getItem('bx-home-sy'))>50)d.classList.add('bx-restored')}catch(e){}})()`,
        }}
      />
      <div className="relative -mt-22 md:-mt-24">
        <span id="hero-top" aria-hidden className="pointer-events-none absolute left-0 top-6 h-px w-px" />
        <section
          id="hero"
          aria-labelledby="hero-heading"
          className="relative isolate bg-black h-svh min-h-[580px] flex items-center justify-center z-10"
        >
          {HERO_IMAGE.isPlaceholder ? (
            <div
              aria-hidden
              className="absolute inset-0 -z-10 overflow-hidden bg-[radial-gradient(55%_50%_at_70%_15%,rgba(74,124,247,0.13),transparent_70%),radial-gradient(50%_45%_at_15%_95%,rgba(207,67,48,0.12),transparent_70%),linear-gradient(180deg,#ffffff,#ffffff)]"
            />
          ) : (
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <Image
                src={HERO_IMAGE.src}
                alt=""
                fill
                priority
                sizes="100vw"
                className="hero-photo object-cover"
                style={photoStyle}
              />
              {/* Rich overall dark tint across the entire background */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-black/45"
              />
            </div>
          )}
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
