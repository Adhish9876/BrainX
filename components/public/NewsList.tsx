import { ArrowUpRight } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import type { News } from '@/lib/types';
import { formatDate } from './format';

/** Editorial news list: plain typography on hairline rules, no boxes. Rows without a date omit it. */
export default function NewsList({ news }: { news: News[] }) {
  if (news.length === 0) return null;

  return (
    <ol className="border-t border-slate-300/80">
      {news.map((item, index) => {
        const date = formatDate(item.date);
        const featured = index === 0;
        const tags = item.tags?.join(' · ');

        const body = (
          <>
            <div className="md:col-span-3">
              {date ? (
                <time
                  dateTime={item.date}
                  className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
                >
                  {date}
                </time>
              ) : null}
              {featured ? (
                <p className="mt-2 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-crimson-600">
                  Latest
                </p>
              ) : null}
            </div>

            <div className="min-w-0 md:col-span-9">
              {tags ? (
                <p className="mb-2 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-navy-700">
                  {tags}
                </p>
              ) : null}

              <h3
                className={`font-display font-bold leading-[1.15] tracking-tight text-[#1d1d1f] ${
                  featured ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'
                }`}
              >
                <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_2px] bg-[position:0_100%] bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_2px]">
                  {item.title}
                </span>
                {item.link ? (
                  <ArrowUpRight
                    className="ml-1.5 inline h-[0.8em] w-[0.8em] -translate-y-[0.1em] text-slate-400 transition-all duration-300 group-hover:-translate-y-[0.2em] group-hover:translate-x-0.5 group-hover:text-[#1d1d1f]"
                    aria-hidden
                  />
                ) : null}
              </h3>

              {item.description ? (
                <p
                  className={`mt-3 max-w-3xl leading-relaxed text-[#424245] ${
                    featured ? 'text-base sm:text-lg' : 'text-[0.95rem]'
                  }`}
                >
                  {item.description}
                </p>
              ) : null}
            </div>
          </>
        );

        return (
          <li key={item.id} className="border-b border-slate-300/80">
            <Reveal delay={Math.min(index, 4) * 0.05} y={14}>
              {item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group grid gap-3 py-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-600 md:grid-cols-12 md:gap-8 md:py-10"
                >
                  {body}
                </a>
              ) : (
                <div className="group grid gap-3 py-8 md:grid-cols-12 md:gap-8 md:py-10">{body}</div>
              )}
            </Reveal>
          </li>
        );
      })}
    </ol>
  );
}
