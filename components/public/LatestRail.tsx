import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Newspaper } from 'lucide-react';
import type { News, Publication } from '@/lib/types';
import NewsList from './NewsList';

function sortNews(news: News[]): News[] {
  return [...news].sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });
}

function sortPublications(publications: Publication[]): Publication[] {
  return [...publications].sort((a, b) => b.year - a.year);
}

/**
 * Home "Latest" rail: up to 10 news items with a link to the full feed, plus a
 * recent-publications list so the rail stays useful when news is sparse.
 */
export default function LatestRail({
  news,
  publications,
}: {
  news: News[];
  publications: Publication[];
}) {
  const latestNews = sortNews(news).slice(0, 10);
  const recentPublications = sortPublications(publications).slice(0, 5);

  return (
    <aside className="flex flex-col gap-6" aria-label="Latest from the lab">
      <section className="card overflow-hidden">
        <header className="flex items-center justify-between gap-3 border-b border-rule bg-navy-50/60 px-5 py-4">
          <div className="flex items-center gap-2 text-navy-700">
            <Newspaper className="h-4 w-4" aria-hidden />
            <h2 className="font-display text-base font-semibold">Latest news</h2>
          </div>
          <Link
            href="/events?tab=news"
            className="link-arrow text-xs"
            aria-label="Show all news"
          >
            Show all
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </header>

        <div className="px-5 py-5">
          {latestNews.length > 0 ? (
            <NewsList news={latestNews} />
          ) : (
            <div className="flex flex-col items-start gap-3 py-2 text-sm text-muted">
              <p className="leading-relaxed">
                No news yet. Announcements and updates will be posted here as they happen.
              </p>
              <Link href="/events?tab=news" className="link-arrow text-xs">
                Visit Events &amp; News
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="card overflow-hidden">
        <header className="border-b border-rule bg-navy-50/60 px-5 py-4">
          <h2 className="font-display text-base font-semibold text-navy-700">Recent publications</h2>
        </header>
        {recentPublications.length > 0 ? (
          <ul className="divide-y divide-rule">
            {recentPublications.map((publication) => (
              <li key={publication.id} className="px-5 py-4">
                <div className="flex items-baseline gap-3">
                  <span className="shrink-0 whitespace-nowrap font-display text-sm font-semibold tabular-nums text-navy-500">
                    {publication.year}
                  </span>
                  <h3 className="text-sm leading-snug text-ink">
                    {publication.link ? (
                      <a
                        href={publication.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline-offset-4 hover:underline"
                      >
                        {publication.title}
                        <ArrowUpRight className="ml-1 inline h-3.5 w-3.5 -translate-y-px text-navy-500" aria-hidden />
                      </a>
                    ) : (
                      publication.title
                    )}
                  </h3>
                </div>
                <p className="mt-1 text-xs italic text-muted">{publication.venue}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-5 text-sm text-muted">Publications will be listed here.</p>
        )}
        <div className="border-t border-rule px-5 py-3">
          <Link href="/publications" className="link-arrow text-xs">
            All publications
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </section>
    </aside>
  );
}
