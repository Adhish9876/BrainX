import { ArrowUpRight } from 'lucide-react';
import type { Publication } from '@/lib/types';
import { groupPublicationsByYear } from '@/lib/content';
import TagList from './TagList';

function PublicationEntry({ publication }: { publication: Publication }) {
  return (
    <article className="group">
      <h3 className="font-display text-lg leading-snug text-ink">
        {publication.link ? (
          <a
            href={publication.link}
            target="_blank"
            rel="noopener noreferrer"
            className="decoration-navy-300 underline-offset-4 hover:underline"
          >
            {publication.title}
            <ArrowUpRight className="ml-1 inline h-4 w-4 -translate-y-px text-navy-500" aria-hidden />
          </a>
        ) : (
          publication.title
        )}
      </h3>
      <p className="mt-1.5 text-sm text-muted">{publication.authors}</p>
      <p className="mt-0.5 text-sm italic text-navy-700">{publication.venue}</p>
      <TagList tags={publication.tags} className="mt-3" />
    </article>
  );
}

/** Full publication timeline, grouped by descending year. */
export default function PublicationsTimeline({ publications }: { publications: Publication[] }) {
  const groups = groupPublicationsByYear(publications);

  return (
    <div>
      {groups.map((group) => (
        <section
          key={group.year}
          className="grid gap-6 border-t border-rule py-8 md:grid-cols-[7rem_1fr] md:gap-10"
        >
          <div className="md:sticky md:top-24 md:self-start">
            <p className="font-display text-3xl leading-none text-navy-700">{group.year}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted">
              {group.items.length} {group.items.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
          <ol className="space-y-8">
            {group.items.map((publication) => (
              <li key={publication.id}>
                <PublicationEntry publication={publication} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
