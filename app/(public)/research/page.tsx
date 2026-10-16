import type { Metadata } from 'next';
import { FlaskConical } from 'lucide-react';
import EmptyState from '@/components/public/EmptyState';
import ResearchShowcase from '@/components/public/ResearchShowcase';
import { getContent } from '@/lib/content';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Research',
  description: 'Research themes at BrainX Lab — brain–computer interfaces, EEG signal processing and affective computing.',
};

export default function ResearchPage() {
  const { research } = getContent();

  return research.length ? (
    <ResearchShowcase research={research} />
  ) : (
    <div className="shell py-20">
      <EmptyState
        icon={<FlaskConical className="h-5 w-5" aria-hidden />}
        title="Research themes"
        message="Research topics will be added here."
      />
    </div>
  );
}
