import Link from 'next/link';
import { MapPin } from 'lucide-react';
import type { Site } from '@/lib/types';
import { Monogram } from './Monogram';
import { NAV_ITEMS } from './navigation';

/**
 * Footer: lab identity on the left, contact on the right.
 * Contact details are rendered only when supplied — never fabricated.
 */
export default function SiteFooter({ site }: { site: Site }) {
  return (
    <footer className="mt-24 border-t border-rule bg-surface">
      <div className="shell grid gap-10 py-14 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        <div>
          <div className="flex items-center gap-3">
            <Monogram logo={site.logo} name={site.name} size={40} />
            <div className="leading-tight">
              <p className="font-display text-lg font-semibold text-ink">{site.name}</p>
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted">
                {site.institution}
              </p>
            </div>
          </div>
          {site.about ? (
            <p className="prose-editorial mt-5 max-w-prose text-sm">
              {site.about}
            </p>
          ) : null}
          {site.focus ? (
            <p className="mt-4 text-xs uppercase tracking-[0.14em] text-muted">{site.focus}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between lg:justify-end lg:gap-16">
          <nav aria-label="Footer" className="shrink-0 text-sm">
            <p className="eyebrow">Explore</p>
            <ul className="mt-4 space-y-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-muted transition-colors hover:text-navy-700">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 text-sm">
            <p className="eyebrow">Contact</p>
            <ul className="mt-4 space-y-3 text-muted">
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-navy-600" aria-hidden />
                <span>{site.address || site.institution}</span>
              </li>
              {site.email ? (
                <li>
                  <a href={`mailto:${site.email}`} className="transition-colors hover:text-navy-700">
                    {site.email}
                  </a>
                </li>
              ) : (
                <li className="text-xs italic text-muted">Email to be added.</li>
              )}
              {site.phone ? (
                <li>
                  <a href={`tel:${site.phone}`} className="transition-colors hover:text-navy-700">
                    {site.phone}
                  </a>
                </li>
              ) : (
                <li className="text-xs italic text-muted">Phone to be added.</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-rule">
        <div className="shell flex flex-col gap-1 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}, {site.institution}.
          </p>
          <p>Department of Computer Science and Engineering.</p>
        </div>
      </div>
    </footer>
  );
}
