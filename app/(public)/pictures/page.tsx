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
    <div className="relative isolate overflow-hidden">
      {/* Top decorative contour background rotated to flow downward */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-x-0 top-0 -z-10 h-[300px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent)] md:h-[340px]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/leftbg.png"
          alt=""
          draggable={false}
          className="absolute left-[46%] -top-[680px] w-[1200px] max-w-none -translate-x-1/2 rotate-90 mix-blend-multiply opacity-90 sm:-top-[860px] sm:w-[1500px] lg:-top-[1040px] lg:w-[1800px]"
        />
      </div>

      <PageHeader
        eyebrow="Pictures"
        title="Pictures"
        lead="A visual record of the lab, its people and its work."
        className="bg-transparent [&>div]:pt-8 [&>div]:pb-10 [&>div]:md:pt-10 [&>div]:md:pb-12"
      />

      <div className="shell py-8 md:py-10">
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
    </div>
  );
}
