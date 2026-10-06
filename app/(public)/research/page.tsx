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
    <>
      <PageHeader
        eyebrow="Research"
        title="Research themes"
        lead="Explore the lab’s research topics, methods and directions."
      />

      <div className="shell py-14">
        {research.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {research.map((item, index) => (
            <ResearchCard key={item.id} research={item} index={index} />
          ))}
        </div> : <EmptyState icon={<FlaskConical className="h-5 w-5" aria-hidden />} title="Research themes" message="Research topics will be added here." />}
      </div>
    </>
  );
}
