import type { Metadata } from 'next';
import { BookOpen } from 'lucide-react';
import EmptyState from '@/components/public/EmptyState';
import PublicationsTimeline from '@/components/public/PublicationsTimeline';
import { getContent } from '@/lib/content';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Publications',
  description: 'Journal articles, conference papers and books from BrainX Lab.',
};

export default function PublicationsPage() {
  const { publications, site } = getContent();

  return (
    <div className="relative isolate min-h-screen bg-white">
      {/* Main Apple-style Shell Container */}
      <main id="main" className="shell relative z-10 pt-10 sm:pt-12 md:pt-14 pb-20 md:pb-28 !px-2.5 xs:!px-4 sm:!px-6 md:!px-10">
        {publications.length > 0 ? (
          <PublicationsTimeline publications={publications} yearImages={site.publicationYearImages} />
        ) : (
          <EmptyState
            icon={<BookOpen className="h-5 w-5" aria-hidden />}
            title="Publications"
            message="Publications will be listed here."
          />
        )}
      </main>
    </div>
  );
}
