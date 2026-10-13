import type { Metadata } from 'next';
import { FlaskConical } from 'lucide-react';
import EmptyState from '@/components/public/EmptyState';
import PageHeader from '@/components/public/PageHeader';
import ResearchShowcase from '@/components/public/ResearchShowcase';
import { getContent } from '@/lib/content';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Research',
  description: 'Research themes at BrainX Lab — brain–computer interfaces, EEG signal processing and affective computing.',
};

export default function ResearchPage() {
  const { research } = getContent();

  return (
    <div className="relative isolate min-h-screen bg-white">
      {/* Full background image without dual tone — pure organic blue topographic wave */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0 -z-10 overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/leftbg.png"
          alt=""
          draggable={false}
          className="fixed -left-20 top-0 h-full w-auto max-w-[75vw] object-cover object-left opacity-[0.22] mix-blend-multiply sm:-left-28 lg:left-0"
        />
      </div>

      {/* Main Apple-style Shell Container */}
      <main id="main" className="shell relative z-10 pt-24 sm:pt-28 md:pt-32 pb-20 md:pb-28">
        {research.length ? (
          <ResearchShowcase research={research} />
        ) : (
          <EmptyState
            icon={<FlaskConical className="h-5 w-5" aria-hidden />}
            title="Research themes"
            message="Research topics will be added here."
          />
        )}
      </main>
    </div>
  );
}
