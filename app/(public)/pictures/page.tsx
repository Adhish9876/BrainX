import type { Metadata } from 'next';
import { Images } from 'lucide-react';
import EmptyState from '@/components/public/EmptyState';
import Gallery from '@/components/public/Gallery';
import PageHeader from '@/components/public/PageHeader';
import { getContent } from '@/lib/content';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Pictures',
  description: 'Photographs and moments from BrainX Lab.',
};

export default function PicturesPage() {
  const { pictures } = getContent();

  return (
    <>
      <PageHeader
        eyebrow="Pictures"
        title="Pictures"
        lead="A visual record of the lab, its people and its work."
      />

      <div className="shell py-14">
        {pictures.length > 0 ? (
          <Gallery groups={pictures} />
        ) : (
          <EmptyState
            icon={<Images className="h-5 w-5" aria-hidden />}
            title="No pictures yet"
            message="Photographs from the lab will be collected here. Nothing has been added so far."
          />
        )}
      </div>
    </>
  );
}
