import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import LatestRail from '@/components/public/LatestRail';
import { getContent } from '@/lib/content';

export const dynamic = 'force-static';

export default function HomePage() {
  const { site, news, publications } = getContent();
  const focusAreas = site.focus
    .split(',')
    .map((area) => area.trim())
    .filter(Boolean);

  return (
    <div className="shell grid items-start gap-12 py-12 lg:grid-cols-3 lg:gap-16 lg:py-16">
      {/* Lab information — left, 2fr */}
      <div className="lg:col-span-2">
        <p className="eyebrow">
          {site.institution} · Department of Computer Science &amp; Engineering
        </p>
        <h1 className="mt-5 max-w-3xl font-display text-4xl leading-[1.02] tracking-tight text-ink md:text-[3.5rem]">
          {site.name}
        </h1>
        {site.tagline ? (
          <p className="mt-5 max-w-2xl text-xl leading-relaxed text-navy-700 md:text-2xl">
            {site.tagline}
          </p>
        ) : null}
        <p className="prose-editorial mt-6 max-w-prose text-base">{site.about}</p>

        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="eyebrow">Focus areas</h2>
            <ul className="mt-4 space-y-3">
              {focusAreas.map((area, index) => (
                <li key={area} className="flex items-baseline gap-3 text-sm text-ink">
                  <span className="font-display text-sm font-semibold text-navy-600">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="eyebrow">Where we are</h2>
            <p className="mt-4 flex gap-2 text-sm leading-relaxed text-muted">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-navy-600" aria-hidden />
              <span>{site.address || site.institution}</span>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Explore our{' '}
              <Link href="/team" className="link-arrow text-sm">
                team
              </Link>{' '}
              and{' '}
              <Link href="/projects" className="link-arrow text-sm">
                projects
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/research"
            className="inline-flex items-center gap-2 rounded-full bg-navy-700 px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-navy-800"
          >
            Research themes
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/publications"
            className="inline-flex items-center gap-2 rounded-full border border-rule-strong px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-navy-300 hover:text-navy-700"
          >
            Publications
          </Link>
        </div>
      </div>

      {/* Latest news / publications — right, 1fr, top-aligned */}
      <div className="lg:col-span-1">
        <LatestRail news={news} publications={publications} />
      </div>
    </div>
  );
}
