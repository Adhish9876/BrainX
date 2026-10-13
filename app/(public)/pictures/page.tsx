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
    <div className="relative isolate bg-white">
      <div className="relative isolate -mt-22 overflow-hidden bg-white pt-22 md:-mt-24 md:pt-24">
        {/* Top decorative contour background flowing from the navbar and confined strictly to the header div */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-0 -z-10 overflow-hidden"
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
          title="Pictures"
          lead="A visual record of the lab, its people and its work."
          className="relative z-10 border-slate-200/90 bg-transparent shadow-[0_4px_14px_-4px_rgba(15,23,42,0.08)]"
        />
      </div>

      <div className="min-h-[60vh] bg-[#F8F9FA] shadow-[inset_0_6px_14px_-6px_rgba(15,23,42,0.08)]">
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
    </div>
  );
}
