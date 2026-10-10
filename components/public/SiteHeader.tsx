'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { List, X } from '@phosphor-icons/react';
import type { Site } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Monogram } from './Monogram';
import { isActive, NAV_ITEMS, type NavItem } from './navigation';

const LEFT_ITEMS = NAV_ITEMS.slice(0, 3);
const RIGHT_ITEMS = NAV_ITEMS.slice(3);

export default function SiteHeader({ site }: { site: Site }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  const isHome = pathname === '/';

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // On the home page the header is see-through at the very top, then becomes a
  // frosted bar. IntersectionObserver avoids a scroll listener.
  useEffect(() => {
    if (!isHome) {
      setAtTop(false);
      return;
    }
    const marker = document.getElementById('hero-top');
    if (!marker) {
      setAtTop(false);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setAtTop(entry.isIntersecting));
    observer.observe(marker);
    return () => observer.disconnect();
  }, [isHome]);

  const transparent = isHome && atTop && !open;

  const renderNav = (items: NavItem[], label: string, align: 'left' | 'right') => (
    <nav
      aria-label={label}
      className={cn(
        'hidden items-center gap-0.5 rounded-full border border-ink/10 bg-white/70 p-1 backdrop-blur-md lg:flex',
        align === 'left' ? 'justify-self-end' : 'justify-self-start',
      )}
      onMouseLeave={() => setHovered(null)}
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            onMouseEnter={() => setHovered(item.href)}
            onFocus={() => setHovered(item.href)}
            onBlur={() => setHovered(null)}
            className={cn(
              'relative inline-flex min-h-10 items-center rounded-full px-3.5 text-[0.82rem] font-medium transition-colors',
              active ? 'text-white' : 'text-muted hover:text-ink',
            )}
          >
            {active ? (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 rounded-full bg-ink"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            ) : hovered === item.href ? (
              <motion.span
                layoutId="nav-hover"
                className="absolute inset-0 rounded-full bg-ink/[0.06]"
                transition={{ type: 'spring', stiffness: 500, damping: 36 }}
              />
            ) : null}
            <span className="relative">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-[background-color,border-color] duration-300 motion-reduce:transition-none',
        transparent
          ? 'border-transparent bg-transparent'
          : 'border-ink/10 bg-paper/80 backdrop-blur-xl supports-[backdrop-filter]:bg-paper/70',
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <div className="shell grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-x-4 md:h-[4.75rem] lg:gap-x-8">
        {renderNav(LEFT_ITEMS, 'Primary', 'left')}
        <span className="lg:hidden" aria-hidden />

        {/* Centre slot. On the home page the scrolling hero logo docks here. */}
        {isHome ? (
          <span aria-hidden className="block h-14 w-14" />
        ) : (
          <Link
            href="/"
            aria-label={`${site.name} home`}
            className="block rounded-full focus-visible:outline-offset-4"
          >
            <Monogram logo={site.logo} name={site.name} size={56} />
          </Link>
        )}

        {renderNav(RIGHT_ITEMS, 'Secondary', 'right')}
        <button
          type="button"
          className="col-start-3 inline-flex h-11 w-11 items-center justify-center justify-self-end rounded-full border border-ink/15 bg-white/70 text-ink transition-colors lg:hidden"
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
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-ink/10 bg-paper lg:hidden"
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
                      'flex min-h-12 items-center justify-between rounded-xl px-3 font-display text-2xl',
                      active ? 'bg-ink text-white' : 'text-ink hover:bg-ink/[0.05]',
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
