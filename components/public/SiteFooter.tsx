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
    'inline-flex min-h-9 items-center text-muted transition-colors hover:text-ink';

  return (
    <footer className="relative mt-24 border-t border-ink/10 bg-white">
      <div className="shell grid gap-12 py-14 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
        <div>
          <div className="flex items-center gap-3">
            <Monogram logo={site.logo} name={site.name} size={52} />
            <div className="leading-tight">
              <p className="font-display text-2xl text-ink">{site.name}</p>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted">
                {site.institution}
              </p>
            </div>
          </div>
          {site.tagline ? (
            <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-muted">{site.tagline}</p>
          ) : null}
          <p className="mt-3 text-sm text-muted">Department of Computer Science and Engineering.</p>
        </div>

        <div className="grid gap-10 sm:grid-cols-2">
          <nav aria-label="Footer" className="text-sm">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-ink/60">Explore</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 sm:grid-cols-1">
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
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-ink/60">Contact</p>
            <ul className="mt-4 space-y-3 text-muted">
              <li className="flex gap-2.5">
                <MapPin weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-crimson-600" aria-hidden />
                <span>{site.address || site.institution}</span>
              </li>
              {site.email ? (
                <li className="flex gap-2.5">
                  <EnvelopeSimple weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-crimson-600" aria-hidden />
                  <a href={`mailto:${site.email}`} className="transition-colors hover:text-ink">
                    {site.email}
                  </a>
                </li>
              ) : null}
              {site.phone ? (
                <li className="flex gap-2.5">
                  <Phone weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-crimson-600" aria-hidden />
                  <a href={`tel:${site.phone}`} className="transition-colors hover:text-ink">
                    {site.phone}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-ink/10">
        <div className="shell py-5 text-xs text-muted">
          <p>
            © {new Date().getFullYear()} {site.name}, {site.institution}.
          </p>
        </div>
      </div>
    </footer>
  );
}
