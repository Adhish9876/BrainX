import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import Reveal from './Reveal';
import SectionIntro from './SectionIntro';

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

function ColumnHeader({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink/15 pb-3">
      <h3 className="font-mono text-xs font-normal uppercase tracking-[0.18em] text-muted">{title}</h3>
      <Link href={href} className="group inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink">
        {linkLabel}
        <ArrowRight
          weight="bold"
          className="h-3.5 w-3.5 text-crimson-600 transition-transform group-hover:translate-x-1"
          aria-hidden
        />
      </Link>
    </div>
  );
}

export default function Latest({ publications, news }: { publications: FeedItem[]; news: FeedItem[] }) {
  return (
    <section id="latest" aria-labelledby="latest-heading" className="border-y border-ink/10 bg-white py-24 md:py-32">
      <div className="shell">
        <Reveal>
          <SectionIntro index="04" label="Latest" id="latest-heading" title="Publications and news." />
        </Reveal>

        <div className="mt-14 grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <ColumnHeader title="Recent publications" href="/publications" linkLabel="All publications" />
            {publications.length > 0 ? (
              <ul>
                {publications.map((item, index) => (
                  <li key={item.id} className="border-b border-ink/10">
                    <Reveal delay={index * 0.06} y={14}>
                      <FeedLink
                        item={item}
                        className="group grid grid-cols-[auto_1fr_auto] items-start gap-x-5 py-6 transition-colors hover:bg-ink/[0.025] sm:-mx-3 sm:gap-x-7 sm:px-3"
                      >
                        <span className="pt-1.5 font-mono text-xs tabular-nums text-muted">{item.meta}</span>
                        <span>
                          <span className="block font-display text-[1.45rem] leading-snug text-ink transition-transform duration-300 group-hover:translate-x-1">
                            {item.title}
                          </span>
                          {item.detail ? (
                            <span className="mt-1.5 block text-sm text-muted">{item.detail}</span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 grid h-10 w-10 place-items-center rounded-full border border-ink/15 text-ink transition-all duration-300 group-hover:border-ink group-hover:bg-ink group-hover:text-white">
                          <ArrowUpRight weight="bold" className="h-4 w-4" aria-hidden />
                        </span>
                      </FeedLink>
                    </Reveal>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-muted">Publications will be listed here.</p>
            )}
          </div>

          <div className="lg:col-span-5">
            <ColumnHeader title="News" href="/events?tab=news" linkLabel="All news" />
            {news.length > 0 ? (
              <ul className="mt-6 space-y-4">
                {news.map((item, index) => (
                  <li key={item.id}>
                    <Reveal delay={index * 0.07}>
                      <FeedLink
                        item={item}
                        className="group block rounded-3xl border border-ink/10 bg-paper p-6 transition-all duration-300 hover:-translate-y-1 hover:border-ink/25"
                      >
                        <span className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.14em] text-muted">
                          {item.meta || 'News'}
                          <ArrowUpRight weight="bold" className="h-4 w-4 text-ink" aria-hidden />
                        </span>
                        <span className="mt-5 block font-display text-2xl leading-snug text-ink">{item.title}</span>
                        {item.detail ? (
                          <span className="mt-2 block text-sm leading-relaxed text-muted">{item.detail}</span>
                        ) : null}
                      </FeedLink>
                    </Reveal>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-muted">Announcements will appear here.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
