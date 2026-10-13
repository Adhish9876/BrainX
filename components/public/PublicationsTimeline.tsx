import { ArrowUpRight } from 'lucide-react';
import type { Publication } from '@/lib/types';
import { groupPublicationsByYear } from '@/lib/content';
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from '@/components/ui/timeline';
import TagList from './TagList';

function PublicationEntry({ publication }: { publication: Publication }) {
  return (
    <article className="group rounded-2xl border border-slate-200/90 bg-surface p-6 shadow-[0_10px_28px_-8px_rgba(11,16,32,0.10),0_4px_12px_-3px_rgba(11,16,32,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-[0_18px_38px_-10px_rgba(11,16,32,0.15),0_6px_16px_-4px_rgba(30,150,240,0.09)] sm:p-8 lg:p-9">
      <h3 className="font-display text-xl leading-snug text-ink sm:text-2xl">
        {publication.link ? (
          <a
            href={publication.link}
            target="_blank"
            rel="noopener noreferrer"
            className="decoration-navy-300 underline-offset-4 hover:underline"
          >
            {publication.title}
            <ArrowUpRight className="ml-1.5 inline h-5 w-5 -translate-y-0.5 text-navy-500" aria-hidden />
          </a>
        ) : (
          publication.title
        )}
      </h3>
      <p className="mt-2.5 text-base text-muted">{publication.authors}</p>
      <p className="mt-1 text-base italic text-navy-700">{publication.venue}</p>
      <TagList tags={publication.tags} className="mt-4 [&_li]:px-3.5 [&_li]:py-1 [&_li]:text-xs" />
    </article>
  );
}

/** Full publication timeline, grouped by descending year. */
export default function PublicationsTimeline({ publications }: { publications: Publication[] }) {
  const groups = groupPublicationsByYear(publications);

  const flatEntries = groups.flatMap((group) =>
    group.items.map((publication, idx) => ({
      publication,
      year: group.year,
      yearCount: group.items.length,
      isFirstOfYear: idx === 0,
    })),
  );

  return (
    <Timeline className="w-full pt-4">
      {flatEntries.map((entry, index) => {
        const isLast = index === flatEntries.length - 1;
        return (
          <TimelineItem key={entry.publication.id}>
            <TimelineOppositeContent className="w-24 shrink-0 pr-4 text-left sm:w-32 sm:pr-6">
              {entry.isFirstOfYear ? (
                <div className="pt-0.5">
                  <p className="whitespace-nowrap font-display text-3xl leading-none text-navy-700 sm:text-4xl lg:text-[2.5rem]">
                    {entry.year}
                  </p>
                  <p className="mt-2 whitespace-nowrap text-xs uppercase tracking-[0.14em] text-muted sm:text-[0.76rem]">
                    {entry.yearCount} {entry.yearCount === 1 ? 'entry' : 'entries'}
                  </p>
                </div>
              ) : (
                <span className="inline-block whitespace-nowrap pt-1.5 font-mono text-sm font-medium text-muted/70 sm:text-base">
                  {entry.year}
                </span>
              )}
            </TimelineOppositeContent>

            <TimelineSeparator>
              <TimelineDot color={entry.isFirstOfYear ? 'primary' : 'default'} />
              {!isLast && <TimelineConnector />}
            </TimelineSeparator>

            <TimelineContent>
              <PublicationEntry publication={entry.publication} />
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}
