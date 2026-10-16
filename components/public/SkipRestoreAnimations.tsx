'use client';

import { MotionGlobalConfig } from 'motion/react';

/**
 * When the page is reloaded (or restored via back/forward) the browser puts the visitor back where
 * they were. Scroll-reveal animations would then replay from "below" for everything already in view.
 * For that first moment we make Motion jump straight to final states, then restore normal animations
 * so sections further down still reveal as they are scrolled into view.
 *
 * Runs at module load (before hydration) so it is in place before any reveal starts.
 */
if (typeof window !== 'undefined') {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const restored = nav?.type === 'reload' || nav?.type === 'back_forward';

  if (restored || window.scrollY > 0) {
    MotionGlobalConfig.skipAnimations = true;

    let done = false;
    const release = () => {
      if (done) return;
      done = true;
      MotionGlobalConfig.skipAnimations = false;
      window.removeEventListener('wheel', release);
      window.removeEventListener('touchmove', release);
      window.removeEventListener('keydown', release);
    };
    // Release after the restored position has settled, or as soon as the visitor interacts
    window.setTimeout(release, 2500);
    window.addEventListener('wheel', release, { passive: true });
    window.addEventListener('touchmove', release, { passive: true });
    window.addEventListener('keydown', release);
  }
}

export default function SkipRestoreAnimations() {
  return null;
}
