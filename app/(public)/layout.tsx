import type { ReactNode } from 'react';
import SiteFooter from '@/components/public/SiteFooter';
import ScrollToTopOnNavigate from '@/components/public/ScrollToTopOnNavigate';
import SkipRestoreAnimations from '@/components/public/SkipRestoreAnimations';
import SiteHeader from '@/components/public/SiteHeader';
import { getContent } from '@/lib/content';

export default function PublicLayout({ children }: { children: ReactNode }) {
  const { site } = getContent();

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <SkipRestoreAnimations />
      <ScrollToTopOnNavigate />
      <SiteHeader site={site} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter site={site} />
    </div>
  );
}
