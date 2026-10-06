'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { Site } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Monogram } from './Monogram';
import { isActive, NAV_ITEMS } from './navigation';

export default function SiteHeader({ site }: { site: Site }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile panel on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-navy-700 focus:px-3 focus:py-2 focus:text-sm focus:text-paper"
      >
        Skip to content
      </a>

      <div className="shell flex h-16 items-center justify-between gap-4 md:h-[4.75rem]">
        <Link href="/" className="group flex items-center gap-3" aria-label={`${site.name} home`}>
          <Monogram logo={site.logo} name={site.name} size={38} />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[1.15rem] font-semibold tracking-tight text-ink">
              {site.name}
            </span>
            <span className="mt-0.5 text-[0.66rem] font-medium uppercase tracking-[0.16em] text-muted">
              {site.institution}
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-0.5 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative rounded px-3 py-2 text-[0.82rem] font-medium tracking-wide transition-colors',
                  active ? 'text-navy-700' : 'text-muted hover:text-ink',
                )}
              >
                {item.label}
                <span
                  className={cn(
                    'absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-navy-700 transition-opacity',
                    active ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-rule text-ink md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-rule bg-paper md:hidden"
      >
        <nav aria-label="Mobile" className="shell flex flex-col py-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded px-2 py-3 text-sm font-medium',
                  active ? 'text-navy-700' : 'text-ink',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
