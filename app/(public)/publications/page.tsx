import type { Metadata } from 'next';
import PageHeader from '@/components/public/PageHeader';
import PublicationsTimeline from '@/components/public/PublicationsTimeline';
import { getContent } from '@/lib/content';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Publications',
  description: 'Journal articles, conference papers and books from BrainX Lab.',
};

export default function PublicationsPage() {
  const { publications } = getContent();

  return (
    <>
      <PageHeader
        eyebrow="Publications"
        title="Publications"
        lead="Peer-reviewed journal articles, conference papers and books authored or co-authored by the lab."
      >
        <p className="text-sm text-muted">
          {publications.length} {publications.length === 1 ? 'record' : 'records'}, newest first.
        </p>
      </PageHeader>

      <div className="shell py-14">
        {publications.length > 0 ? (
          <PublicationsTimeline publications={publications} />
        ) : (
          <p className="text-sm text-muted">Publications will be listed here.</p>
        )}
      </div>
    </>
  );
}
