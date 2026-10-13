import { ArrowRight, User } from 'lucide-react';
import type { Member } from '@/lib/types';
import TagList from './TagList';

function getInitials(name: string): string {
  const cleaned = name.replace(/^(dr|prof|mr|ms|mrs)\.?\s+/i, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function TeamCard({ member }: { member: Member }) {
  const initials = getInitials(member.name);

  return (
    <article className="group flex h-full flex-col gap-5 rounded-2xl border border-slate-200/90 bg-surface p-4 shadow-[0_10px_28px_-8px_rgba(11,16,32,0.10),0_4px_12px_-3px_rgba(11,16,32,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_38px_-10px_rgba(11,16,32,0.15),0_6px_16px_-4px_rgba(11,16,32,0.08)] sm:flex-row sm:items-stretch sm:p-5">
      {/* Left — Rounded portrait photo container */}
      <div className="relative aspect-[4/3.6] w-full shrink-0 overflow-hidden rounded-xl bg-transparent sm:aspect-[4/4.6] sm:w-40 md:w-44">
        {member.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.image}
            alt={member.name}
            loading="lazy"
            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border border-slate-200/70 bg-white p-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200/80 bg-white font-display text-lg font-semibold tracking-wider text-navy-700 shadow-2xs">
              {initials}
            </div>
            <span className="inline-flex items-center gap-1 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-slate-400">
              <User className="h-3 w-3" aria-hidden />
              Photo
            </span>
          </div>
        )}
      </div>

      {/* Right — Member details & action button */}
      <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
        <div>
          <h3 className="font-display text-xl font-bold leading-snug tracking-tight text-ink sm:text-[1.35rem]">
            {member.name}
          </h3>
          {member.position ? (
            <p className="mt-1 font-mono text-xs font-medium text-navy-700">{member.position}</p>
          ) : null}

          {member.description ? (
            <p className="mt-3 text-sm leading-relaxed text-muted">{member.description}</p>
          ) : null}

          {member.tags.length > 0 ? <TagList tags={member.tags} className="mt-3.5" /> : null}
        </div>

        {member.link ? (
          <div className="mt-5 pt-1">
            <a
              href={member.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-paper/80 px-4 py-2 text-xs font-semibold text-ink transition-all hover:border-ink hover:bg-ink hover:text-white"
            >
              View profile
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              <span className="sr-only"> for {member.name}</span>
            </a>
          </div>
        ) : null}
      </div>
    </article>
  );
}
