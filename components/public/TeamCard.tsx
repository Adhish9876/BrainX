import { ArrowUpRight } from 'lucide-react';
import type { Member } from '@/lib/types';
import RevealBio from './RevealBio';

export function getInitials(name: string): string {
  const cleaned = name.replace(/^(dr|prof|mr|ms|mrs)\.?\s+/i, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

// Soft, on-brand gradients for members without a photo (deterministic per name)
const AVATAR_GRADIENTS = [
  'from-sky-200 via-sky-100 to-orange-100',
  'from-orange-200 via-amber-100 to-sky-100',
  'from-indigo-200 via-sky-100 to-white',
  'from-teal-200 via-cyan-100 to-orange-50',
  'from-rose-200 via-orange-100 to-sky-100',
  'from-blue-200 via-indigo-100 to-orange-50',
];

function gradientFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

/** Portrait that falls back to a gradient monogram when no photo has been uploaded. */
export function MemberPortrait({
  member,
  className = '',
  initialsClassName = 'text-5xl',
  zoomOnHover = false,
  priority = false,
}: {
  member: Member;
  className?: string;
  initialsClassName?: string;
  zoomOnHover?: boolean;
  priority?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {member.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.image}
          alt={member.name}
          loading={priority ? 'eager' : 'lazy'}
          className={`h-full w-full object-cover object-top ${
            zoomOnHover ? 'transition-transform duration-700 ease-out group-hover:scale-[1.05]' : ''
          }`}
        />
      ) : (
        <div
          className={`relative flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientFor(member.name)}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/team_bg.png"
            alt=""
            aria-hidden="true"
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-70 mix-blend-soft-light"
          />
          <span
            aria-hidden="true"
            className={`relative font-display font-extrabold tracking-tight text-white drop-shadow-[0_2px_18px_rgba(30,64,120,0.35)] ${initialsClassName}`}
          >
            {getInitials(member.name)}
          </span>
          <span className="sr-only">{member.name}</span>
        </div>
      )}
    </div>
  );
}

export default function TeamCard({ member, wide = false }: { member: Member; wide?: boolean }) {
  return (
    <article className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(11,16,32,0.04),0_12px_32px_-12px_rgba(11,16,32,0.10)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-slate-300 hover:shadow-[0_2px_4px_rgba(11,16,32,0.04),0_28px_50px_-16px_rgba(11,16,32,0.20)] ${
        wide ? 'sm:flex-row sm:gap-2' : ''
      }`}>
      <MemberPortrait
        member={member}
        zoomOnHover
        className={`w-full rounded-2xl ${
          wide ? 'aspect-[4/3.4] sm:aspect-auto sm:min-h-[15rem] sm:w-60 sm:shrink-0' : 'aspect-[4/3.4]'
        }`}
        initialsClassName="text-6xl"
      />

      <div className="flex flex-1 flex-col px-3 pb-3 pt-5">
        <h3 className="font-display text-xl font-bold leading-snug tracking-tight text-[#1d1d1f]">
          {member.name}
        </h3>
        {member.position ? (
          <p className="mt-1 text-[0.8rem] font-medium leading-snug text-navy-700">{member.position}</p>
        ) : null}

        {member.description ? (
          <RevealBio text={member.description} size="sm" className="mt-4" />
        ) : null}

        {member.link ? (
          <div className="mt-auto flex justify-end pt-5">
            <a
              href={member.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[#1d1d1f] transition-all duration-300 hover:border-[#1d1d1f] hover:bg-[#1d1d1f] hover:text-white"
            >
              <ArrowUpRight className="h-4 w-4" aria-hidden />
              <span className="sr-only">View profile for {member.name}</span>
            </a>
          </div>
        ) : null}
      </div>
    </article>
  );
}
