'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { List, X } from '@phosphor-icons/react';
import type { Site } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Monogram } from './Monogram';
import { isActive, NAV_ITEMS } from './navigation';

export default function SiteHeader({ site }: { site: Site }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-white/95 backdrop-blur-md">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <div className="shell flex h-16 items-center justify-between gap-6 md:h-[4.5rem]">
        {/* Brand on the left */}
        <Link
          href="/"
          aria-label={`${site.name} home`}
          className="flex shrink-0 items-center gap-3 focus-visible:outline-offset-4"
        >
          <Monogram logo={site.logo} name={site.name} size={42} />
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            {site.name}
          </span>
        </Link>

        {/* Clean horizontal navigation links */}
        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex xl:gap-9">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'py-1 text-[0.95rem] font-medium transition-colors',
                  active
                    ? 'text-[#1d9bf0]'
                    : 'text-[#5b616e] hover:text-ink',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-ink/12 bg-white text-ink transition-colors hover:bg-paper lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X weight="bold" className="h-5 w-5" /> : <List weight="bold" className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id="mobile-nav"
            key="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-ink/10 bg-white lg:hidden"
          >
            <nav aria-label="Mobile" className="shell flex flex-col py-3">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-11 items-center justify-between rounded-lg px-3 text-base font-medium transition-colors',
                      active
                        ? 'bg-sky-50 text-[#1d9bf0]'
                        : 'text-[#5b616e] hover:bg-ink/[0.04] hover:text-ink',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
