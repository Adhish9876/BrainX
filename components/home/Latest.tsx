import Link from 'next/link';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import Reveal from './Reveal';

export type FeedItem = {
  id: string;
  meta: string;
  title: string;
  detail?: string;
  href: string;
  external: boolean;
};

function FeedLink({
  item,
  className,
  children,
}: {
  item: FeedItem;
  className: string;
  children: React.ReactNode;
}) {
  return item.external ? (
    <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  ) : (
    <Link href={item.href} className={className}>
      {children}
    </Link>
  );
}

export default function Latest({ publications, news }: { publications: FeedItem[]; news: FeedItem[] }) {
  return (
    <section id="latest" aria-labelledby="latest-heading" className="bg-paper py-28 md:py-36">
      <div className="shell">
        {/* Section label */}
        <Reveal>
          <div className="mb-16 flex items-center gap-6">
            <span className="h-px flex-1 bg-ink/10" />
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-muted">
              04 — Latest
            </span>
            <span className="h-px w-10 bg-ink/10" />
          </div>
        </Reveal>

        <div className="grid gap-20 lg:grid-cols-[1fr_1px_1fr] lg:gap-0">
          {/* Publications column */}
          <div className="lg:pr-16">
            <Reveal>
              <div className="flex items-center justify-between border-b border-ink/15 pb-4">
                <h2
                  id="latest-heading"
                  className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted"
                >
                  Recent publications
                </h2>
                <Link
                  href="/publications"
                  className="group inline-flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink/50 transition-colors hover:text-ink"
                >
                  View all
                  <ArrowUpRight weight="bold" className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                </Link>
              </div>
            </Reveal>

            {publications.length > 0 ? (
              <ul>
                {publications.map((item, index) => (
                  <li key={item.id} className="border-b border-ink/8">
                    <Reveal delay={index * 0.06} y={12}>
                      <FeedLink
                        item={item}
                        className="group flex items-start gap-5 py-7 transition-colors hover:bg-ink/[0.02]"
                      >
                        <span className="mt-1 shrink-0 font-mono text-[0.65rem] tabular-nums text-muted">
                          {item.meta}
                        </span>
                        <span className="flex-1">
                          <span className="block font-display text-[1.3rem] leading-[1.25] tracking-[-0.01em] text-ink transition-colors group-hover:text-ink/70">
                            {item.title}
                          </span>
                          {item.detail && (
                            <span className="mt-2 block font-mono text-[0.68rem] uppercase tracking-[0.1em] text-muted">
                              {item.detail}
                            </span>
                          )}
                        </span>
                        <ArrowUpRight
                          weight="bold"
                          className="mt-0.5 h-4 w-4 shrink-0 text-ink/20 transition-all group-hover:text-crimson-500"
                          aria-hidden
                        />
                      </FeedLink>
                    </Reveal>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 font-mono text-sm text-muted">Publications listed here.</p>
            )}
          </div>

          {/* Vertical divider */}
          <span className="hidden bg-ink/10 lg:block" aria-hidden />

          {/* News column */}
          <div className="lg:pl-16">
            <Reveal delay={0.06}>
              <div className="flex items-center justify-between border-b border-ink/15 pb-4">
                <h3 className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted">News</h3>
                <Link
                  href="/events?tab=news"
                  className="group inline-flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink/50 transition-colors hover:text-ink"
                >
                  View all
                  <ArrowUpRight weight="bold" className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                </Link>
              </div>
            </Reveal>

            {news.length > 0 ? (
              <ul className="mt-2">
                {news.map((item, index) => (
                  <li key={item.id} className="border-b border-ink/8">
                    <Reveal delay={index * 0.07} y={12}>
                      <FeedLink
                        item={item}
                        className="group block py-7 transition-colors hover:bg-ink/[0.02]"
                      >
                        <span className="flex items-center justify-between">
                          <span className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted">
                            {item.meta || 'News'}
                          </span>
                          <ArrowUpRight
                            weight="bold"
                            className="h-3.5 w-3.5 text-ink/20 transition-colors group-hover:text-crimson-500"
                            aria-hidden
                          />
                        </span>
                        <span className="mt-4 block font-display text-[1.3rem] leading-[1.25] tracking-[-0.01em] text-ink">
                          {item.title}
                        </span>
                        {item.detail && (
                          <span className="mt-2 block text-[0.88rem] leading-relaxed text-muted">
                            {item.detail}
                          </span>
                        )}
                      </FeedLink>
                    </Reveal>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 font-mono text-sm text-muted">Announcements appear here.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
