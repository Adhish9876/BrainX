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
    <div className="relative isolate overflow-hidden">
      {/* Top decorative contour background (2nd stage) rotated to flow downward */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-x-0 top-0 -z-10 h-[260px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent)] md:h-[300px]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/2stage.png"
          alt=""
          draggable={false}
          className="absolute left-1/2 -top-[760px] w-[1100px] max-w-none -translate-x-1/2 rotate-90 mix-blend-multiply opacity-90 sm:-top-[980px] sm:w-[1380px] lg:-top-[1200px] lg:w-[1680px]"
        />
      </div>

      <PageHeader
        eyebrow="Publications"
        title="Publications"
        lead="Peer-reviewed journal articles, conference papers and books authored or co-authored by the lab."
        className="bg-transparent [&>div]:pt-8 [&>div]:pb-10 [&>div]:md:pt-10 [&>div]:md:pb-12"
      >
        <p className="text-sm text-muted">
          {publications.length} {publications.length === 1 ? 'record' : 'records'}, newest first.
        </p>
      </PageHeader>

      <div className="shell py-8 md:py-10">
        {publications.length > 0 ? (
          <PublicationsTimeline publications={publications} />
        ) : (
          <p className="text-sm text-muted">Publications will be listed here.</p>
        )}
      </div>
    </div>
  );
}
