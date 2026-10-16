'use client';

import { useEffect, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * After a client-side navigation, make sure the new page starts at the very top (instantly, before paint).
 * Page-level scrolling is instant site-wide; in-page "#section" links scroll smoothly via the click handler
 * below. Hash links on load are left alone.
 */
export default function ScrollToTopOnNavigate() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (window.location.hash) return;
    const html = document.documentElement;
    const previous = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    html.style.scrollBehavior = previous;
  }, [pathname]);

  // Smooth scrolling for in-page anchor links only (not for route changes)
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!link || link.getAttribute('href') === '#') return;
      const target = document.getElementById(link.getAttribute('href')!.slice(1));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
