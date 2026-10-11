import type { Metadata } from 'next';
import { FlaskConical } from 'lucide-react';
import EmptyState from '@/components/public/EmptyState';
import PageHeader from '@/components/public/PageHeader';
import ResearchCard from '@/components/public/ResearchCard';
import { getContent } from '@/lib/content';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Research',
  description: 'Research themes at BrainX Lab — brain–computer interfaces, EEG signal processing and affective computing.',
};

export default function ResearchPage() {
  const { research } = getContent();

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
        eyebrow="Research"
        title="Research themes"
        lead="Explore the lab’s research topics, methods and directions."
        className="bg-transparent [&>div]:pt-8 [&>div]:pb-10 [&>div]:md:pt-10 [&>div]:md:pb-12"
      />

      <div className="shell py-8 md:py-10">
        {research.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {research.map((item, index) => (
            <ResearchCard key={item.id} research={item} index={index} />
          ))}
        </div> : <EmptyState icon={<FlaskConical className="h-5 w-5" aria-hidden />} title="Research themes" message="Research topics will be added here." />}
      </div>
    </div>
  );
}
