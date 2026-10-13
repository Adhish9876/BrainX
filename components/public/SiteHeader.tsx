'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { List, X } from '@phosphor-icons/react';
import type { Site } from '@/lib/types';
import { cn } from '@/lib/utils';
import { isActive, NAV_ITEMS } from './navigation';

export default function SiteHeader({ site }: { site: Site }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === '/';

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const checkScroll = () => {
      const y =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      setScrolled(y > 2);
    };

    checkScroll();
    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, [pathname]);

  const showSolid = scrolled || open;
  const hiddenOnHome = isHome && !showSolid;

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow,opacity,transform] duration-200 ease-out',
        hiddenOnHome
          ? 'pointer-events-none -translate-y-full border-transparent bg-transparent opacity-0 shadow-none'
          : showSolid
            ? 'pointer-events-auto translate-y-0 border-ink/10 bg-white opacity-100 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)]'
            : 'pointer-events-auto translate-y-0 border-transparent bg-transparent opacity-100 shadow-none',
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <div className="flex h-22 w-full items-center justify-between gap-6 px-4 sm:px-6 md:h-24 lg:px-10">
        {/* Brand on the left */}
        <Link
          href="/"
          aria-label={`${site.name} home`}
          className="flex shrink-0 items-center gap-3.5 focus-visible:outline-offset-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/iiitdm.png"
            alt="IIITDM"
            className="h-14 w-14 shrink-0 object-contain md:h-[4.25rem] md:w-[4.25rem]"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/main_logo.png"
            alt=""
            className="h-10 w-auto shrink-0 object-contain md:h-12"
          />
          <span className="sr-only">{site.name}</span>
        </Link>

        {/* Clean horizontal navigation links */}
        <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex xl:gap-10">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'py-1 text-[1.08rem] font-medium transition-colors xl:text-[1.14rem]',
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
