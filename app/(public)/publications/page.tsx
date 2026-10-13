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
    <div className="relative isolate bg-white">
      <div className="relative isolate -mt-22 overflow-hidden bg-white pt-22 md:-mt-24 md:pt-24">
        {/* Top decorative contour background flowing from the navbar and confined strictly to the header div */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-0 -z-10 overflow-hidden"
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
          title="Publications"
          lead="Peer-reviewed journal articles, conference papers and books authored or co-authored by the lab."
          className="relative z-10 border-b border-slate-200/90 bg-transparent shadow-[0_4px_14px_-4px_rgba(15,23,42,0.08)]"
        >
          <p className="text-sm text-muted">
            {publications.length} {publications.length === 1 ? 'record' : 'records'}, newest first.
          </p>
        </PageHeader>
      </div>

      <div className="bg-[#F1F3F5] shadow-[inset_0_6px_14px_-6px_rgba(15,23,42,0.10)]">
        <div className="shell relative z-10 py-8 md:py-10">
          {publications.length > 0 ? (
            <PublicationsTimeline publications={publications} />
          ) : (
            <p className="text-sm text-muted">Publications will be listed here.</p>
          )}
        </div>
      </div>
    </div>
  );
}
