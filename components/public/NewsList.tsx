import { ArrowUpRight } from 'lucide-react';
import type { News } from '@/lib/types';
import { formatDate } from './format';
import TagList from './TagList';

function NewsRow({ item }: { item: News }) {
  const date = formatDate(item.date);
  return (
    <li className="border-t border-rule py-5 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-[0.12em] text-muted">
        {date ? <time dateTime={item.date}>{date}</time> : null}
        {item.tags?.length ? <span aria-hidden className="text-muted">•</span> : null}
        <span>{item.tags?.join(' · ')}</span>
      </div>
      <h3 className="mt-2 font-display text-lg leading-snug text-ink">
        {item.link ? (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 hover:underline"
          >
            {item.title}
            <ArrowUpRight className="ml-1 inline h-4 w-4 -translate-y-px text-navy-500" aria-hidden />
          </a>
        ) : (
          item.title
        )}
      </h3>
      {item.description ? (
        <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
      ) : null}
    </li>
  );
}

/** Compact, honest news list. Rows without a date simply omit the date. */
export default function NewsList({ news }: { news: News[] }) {
  return (
    <ul>
      {news.map((item) => (
        <NewsRow key={item.id} item={item} />
      ))}
    </ul>
  );
}
