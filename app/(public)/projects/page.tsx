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
    <>
      <PageHeader
        eyebrow="Projects"
        title="Projects"
        lead="Funded research and collaborative projects hosted by the lab."
      />

      <div className="shell py-14">
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
    </>
  );
}
