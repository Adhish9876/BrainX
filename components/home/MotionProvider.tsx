'use client';

import type { ReactNode } from 'react';
import { MotionConfig } from 'motion/react';

/** Honours prefers-reduced-motion for every Motion animation beneath it. */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
