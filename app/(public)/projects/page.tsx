import type { Metadata } from 'next';
import { FolderKanban } from 'lucide-react';
import EmptyState from '@/components/public/EmptyState';
import PageHeader from '@/components/public/PageHeader';
import ProjectCard from '@/components/public/ProjectCard';
import { getContent } from '@/lib/content';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Funded and collaborative projects at BrainX Lab.',
};

export default function ProjectsPage() {
  const { projects } = getContent();

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
        eyebrow="Projects"
        title="Projects"
        lead="Funded research and collaborative projects hosted by the lab."
        className="bg-transparent [&>div]:pt-8 [&>div]:pb-10 [&>div]:md:pt-10 [&>div]:md:pb-12"
      />

      <div className="shell py-8 md:py-10">
        {projects.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FolderKanban className="h-5 w-5" aria-hidden />}
            title="Projects coming soon"
            message="Project pages will appear here once details are ready to publish. Nothing has been listed yet."
          />
        )}
      </div>
    </div>
  );
}
