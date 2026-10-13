import type { Metadata } from 'next';
import PageHeader from '@/components/public/PageHeader';
import ProjectsShowcase from '@/components/public/ProjectsShowcase';
import { getContent } from '@/lib/content';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Funded and collaborative projects at BrainX Lab.',
};

export default function ProjectsPage() {
  const { projects, team } = getContent();

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
          title="Projects"
          lead="Funded research and collaborative projects hosted by the lab."
          className="relative z-10 border-b border-slate-200/90 bg-transparent shadow-[0_4px_14px_-4px_rgba(15,23,42,0.08)]"
        />
      </div>

      <div className="relative bg-[#F1F3F5] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] shadow-[inset_0_6px_14px_-6px_rgba(15,23,42,0.10)]">
        <div className="shell relative z-10 py-10 md:py-12">
          <ProjectsShowcase projects={projects} team={team} />
        </div>
      </div>
    </div>
  );
}
