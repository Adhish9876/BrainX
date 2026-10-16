import Link from 'next/link';
import { EnvelopeSimple, MapPin, Phone } from '@phosphor-icons/react/dist/ssr';
import type { Site } from '@/lib/types';
import { Monogram } from './Monogram';
import { NAV_ITEMS } from './navigation';

/**
 * Footer: lab identity, navigation and contact.
 * Contact details are rendered only when supplied — never fabricated.
 */
export default function SiteFooter({ site }: { site: Site }) {
  const linkClass =
    'inline-flex min-h-8 items-center text-white/60 transition-colors hover:text-white';

  return (
    <footer className="relative mt-12 overflow-hidden border-t border-white/10 bg-black text-white">
      <div className="shell relative z-10 grid gap-8 pt-9 pb-5 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
        <div>
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brainx_lab_logo_solid.png"
              alt={`${site.name} logo`}
              className="h-12 sm:h-14 w-auto shrink-0 object-contain"
            />
            <div className="leading-tight">
              <p className="font-display text-2xl font-bold tracking-tight text-white">{site.name}</p>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/50">
                {site.institution}
              </p>
            </div>
          </div>
          {site.tagline ? (
            <p className="mt-4 max-w-md text-[0.9rem] leading-relaxed text-white/70">{site.tagline}</p>
          ) : null}
          <p className="mt-3 text-sm text-white/50">Department of Computer Science and Engineering.</p>
        </div>

        <div className="grid gap-8 sm:grid-cols-[1.3fr_1fr]">
          <nav aria-label="Footer" className="text-sm">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-white/40">Explore</p>
            <ul className="mt-3 grid grid-cols-2 gap-x-6">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 text-sm">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-white/40">Contact</p>
            <ul className="mt-4 space-y-3 text-white/70">
              <li className="flex gap-2.5">
                <MapPin weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-crimson-400" aria-hidden />
                <span>{site.address || site.institution}</span>
              </li>
              {site.email ? (
                <li className="flex gap-2.5">
                  <EnvelopeSimple weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-crimson-400" aria-hidden />
                  <a href={`mailto:${site.email}`} className="transition-colors hover:text-white">
                    {site.email}
                  </a>
                </li>
              ) : null}
              {site.phone ? (
                <li className="flex gap-2.5">
                  <Phone weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-crimson-400" aria-hidden />
                  <a href={`tel:${site.phone}`} className="transition-colors hover:text-white">
                    {site.phone}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>

      {/* Massive "BrainX" bottom display text */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none relative w-full flex justify-center overflow-hidden leading-none pb-1"
      >
        <span
          className="font-display text-[9vw] font-black tracking-tight select-none block text-white"
          style={{
            maskImage: 'linear-gradient(to bottom, #000 0%, #000 38%, transparent 96%)',
            WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 38%, transparent 96%)',
          }}
        >
          BrainX
        </span>
      </div>

      <div className="relative z-10 border-t border-white/10">
        <div className="shell flex flex-col sm:flex-row items-center justify-between gap-3 py-3 text-xs text-white/40">
          <p>
            © {new Date().getFullYear()} {site.name}, {site.institution}.
          </p>
          <p className="font-mono text-[0.65rem] tracking-wider uppercase text-white/30">
            Brain–Computer Interfaces & AI Lab
          </p>
        </div>
      </div>
    </footer>
  );
}
