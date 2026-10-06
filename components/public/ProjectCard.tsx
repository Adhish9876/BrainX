import { ArrowUpRight, Image as ImageIcon } from 'lucide-react';
import type { Project } from '@/lib/types';
import TagList from './TagList';

export default function ProjectCard({ project }: { project: Project }) {
  const Wrapper = project.link ? 'a' : 'div';
  const wrapperProps = project.link
    ? { href: project.link, target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <article className="card group flex flex-col overflow-hidden transition-colors hover:border-navy-200">
      <div className="relative aspect-[16/10] overflow-hidden bg-navy-50">
        {project.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.image}
            alt={project.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-navy-300">
            <ImageIcon className="h-8 w-8" aria-hidden />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl leading-snug text-ink">{project.title}</h3>
          {project.link ? (
            <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-navy-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          ) : null}
        </div>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{project.description}</p>
        <TagList tags={project.tags} className="mt-5" />
      </div>
    </article>
  );
}
