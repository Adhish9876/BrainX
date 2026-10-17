'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
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

  // Lock body scroll when side panel is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

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
    <>
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

        <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:h-20 sm:gap-6 sm:px-6 md:h-24 lg:px-10">
          {/* Brand on the left */}
          <Link
            href="/"
            aria-label={`${site.name} home`}
            className="flex shrink-0 items-center gap-0.5 focus-visible:outline-offset-4 md:gap-1"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brainx_lab_logo.png"
              alt=""
              className="h-10 w-auto shrink-0 object-contain sm:h-14 md:h-20"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/iiit_header.png"
              alt="IIITDM Kancheepuram"
              className="h-5 w-auto shrink-0 translate-y-1 object-contain sm:h-7 sm:translate-y-1.5 md:h-9 md:translate-y-2"
            />
            <span className="sr-only">{site.name}</span>
          </Link>

          {/* Clean horizontal navigation links (Desktop) */}
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

          {/* Mobile menu hamburger button */}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200/90 bg-white/90 text-slate-900 shadow-2xs backdrop-blur-md transition-all hover:bg-slate-100 active:scale-95 cursor-pointer lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-side-panel"
            aria-label="Open navigation menu"
            onClick={() => setOpen(true)}
          >
            <div className="flex h-3.5 w-4 flex-col justify-between">
              <span className="h-[2px] w-full rounded-full bg-slate-800" />
              <span className="h-[2px] w-full rounded-full bg-slate-800" />
              <span className="h-[2px] w-full rounded-full bg-slate-800" />
            </div>
          </button>
        </div>
      </header>

      {/* ── Mobile Side Panel Navigation Overlay (like MIT Jameel Clinic) ── */}
      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-[100] lg:hidden">
            {/* Dark Scrim Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Side Panel Drawer */}
            <motion.aside
              id="mobile-side-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-y-0 right-0 flex w-full max-w-[21rem] xs:max-w-[23rem] flex-col bg-gradient-to-b from-[#eaf4fc] via-[#f7fafc] to-white px-6 py-6 shadow-2xl overflow-y-auto"
            >
              {/* Header inside Panel: Logo + Close X */}
              <div className="flex items-center justify-between pb-6">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-1"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brainx_lab_logo.png"
                    alt=""
                    className="h-10 w-auto shrink-0 object-contain"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/iiit_header.png"
                    alt="IIITDM Kancheepuram"
                    className="h-5 w-auto shrink-0 translate-y-1 object-contain"
                  />
                </Link>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation menu"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-slate-800 transition-colors hover:bg-black/5 active:scale-95 cursor-pointer"
                >
                  <X className="h-6 w-6 stroke-[2.2]" />
                </button>
              </div>

              {/* Grouped Editorial Navigation (Image 2 style) */}
              <div className="mt-4 flex flex-col space-y-7">
                {/* Section 1: About BrainX Lab */}
                <div>
                  <div className="h-[2px] w-full bg-[#1d1d1f] mb-3.5" />
                  <h3 className="font-display text-[1.3rem] font-extrabold tracking-tight text-[#1d1d1f] mb-3">
                    About BrainX Lab
                  </h3>
                  <nav className="flex flex-col space-y-3">
                    {[
                      { href: '/', label: 'Home' },
                      { href: '/team', label: 'Team' },
                      { href: '/research', label: 'Research' },
                      { href: '/publications', label: 'Publications' },
                    ].map((item) => {
                      const active = isActive(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'text-[1.12rem] leading-normal transition-colors py-0.5',
                            active
                              ? 'font-bold text-[#0066cc]'
                              : 'font-normal text-[#1d1d1f] hover:text-[#0066cc]',
                          )}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* Section 2: Work & Initiatives */}
                <div>
                  <div className="h-[2px] w-full bg-[#1d1d1f] mb-3.5" />
                  <h3 className="font-display text-[1.3rem] font-extrabold tracking-tight text-[#1d1d1f] mb-3">
                    Our Work
                  </h3>
                  <nav className="flex flex-col space-y-3">
                    {[
                      { href: '/projects', label: 'Projects' },
                      { href: '/events', label: 'Events & News' },
                      { href: '/pictures', label: 'Pictures' },
                    ].map((item) => {
                      const active = isActive(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'text-[1.12rem] leading-normal transition-colors py-0.5',
                            active
                              ? 'font-bold text-[#0066cc]'
                              : 'font-normal text-[#1d1d1f] hover:text-[#0066cc]',
                          )}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </div>

              {/* Bottom Institutional Info */}
              <div className="mt-auto pt-8 border-t border-slate-300/60">
                <p className="font-display text-sm font-bold text-[#1d1d1f]">
                  Brain–Computer Interfaces &amp; AI Lab
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Department of Computer Science &amp; Engineering
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mt-1">
                  IIITDM Kancheepuram, Chennai
                </p>
              </div>
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

