import type { Metadata } from 'next';
import { ArrowRight, User } from 'lucide-react';
import PageHeader from '@/components/public/PageHeader';
import SectionHeading from '@/components/public/SectionHeading';
import TagList from '@/components/public/TagList';
import TeamCard from '@/components/public/TeamCard';
import { getContent, groupTeamByRole } from '@/lib/content';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Team',
  description: 'The people of BrainX Lab, IIITDM Kancheepuram.',
};

function getInitials(name: string): string {
  const cleaned = name.replace(/^(dr|prof|mr|ms|mrs)\.?\s+/i, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function TeamPage() {
  const { team } = getContent();
  const principal = team.find((member) => member.role === 'Principal Investigator');
  const groups = groupTeamByRole(team.filter((member) => member.id !== principal?.id));

  return (
    <div className="relative isolate bg-white">
      <div className="relative isolate -mt-22 overflow-hidden bg-white pt-22 md:-mt-24 md:pt-24">
        {/* Top decorative contour background flowing from the navbar and confined strictly to the header div */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-0 -z-10 overflow-hidden"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/2stage.png"
            alt=""
            draggable={false}
            className="absolute left-1/2 -top-[760px] w-[1100px] max-w-none -translate-x-1/2 rotate-90 mix-blend-multiply opacity-90 sm:-top-[980px] sm:w-[1380px] lg:-top-[1200px] lg:w-[1680px]"
          />
        </div>

        <PageHeader
          title="People"
          lead="BrainX Lab brings together a principal investigator, project staff, research scholars and students working across brain–computer interfaces and affective computing."
          className="bg-transparent"
        />
      </div>

      <div className="shell space-y-14 pt-5 pb-12 md:pt-7">
        {principal ? (
          <section aria-labelledby="principal-investigator">
            <article className="flex flex-col gap-7 rounded-2xl border border-slate-200/90 bg-surface p-5 shadow-[0_12px_34px_-10px_rgba(11,16,32,0.11),0_4px_14px_-3px_rgba(11,16,32,0.06)] sm:p-7 md:flex-row md:items-stretch md:gap-9 md:p-8">
              {/* Left — PI Portrait (from Admin Panel) */}
              <div className="relative aspect-[4/4.5] w-full shrink-0 overflow-hidden rounded-xl bg-transparent md:w-64 lg:w-72">
                {principal.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={principal.image}
                    alt={principal.name}
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 rounded-xl border border-slate-200/70 bg-white p-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200/80 bg-white font-display text-xl font-semibold tracking-wider text-navy-700 shadow-2xs">
                      {getInitials(principal.name)}
                    </div>
                    <span className="inline-flex items-center gap-1 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-slate-400">
                      <User className="h-3.5 w-3.5" aria-hidden />
                      Photo
                    </span>
                  </div>
                )}
              </div>

              {/* Right — PI Bio & Details */}
              <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                <div>
                  <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-crimson-600">
                    Principal Investigator
                  </span>
                  <h3
                    id="principal-investigator"
                    className="mt-2 font-display text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl lg:text-[2.1rem]"
                  >
                    {principal.name}
                  </h3>
                  {principal.position ? (
                    <p className="mt-1.5 font-mono text-xs font-medium text-navy-700 sm:text-sm">
                      {principal.position}
                    </p>
                  ) : null}

                  <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted sm:text-base sm:leading-[1.75]">
                    {principal.description}
                  </p>

                  {principal.tags.length > 0 ? (
                    <TagList tags={principal.tags} className="mt-5" />
                  ) : null}
                </div>

                {principal.link ? (
                  <div className="mt-6 pt-1">
                    <a
                      href={principal.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-paper/80 px-5 py-2.5 text-sm font-semibold text-ink transition-all hover:border-ink hover:bg-ink hover:text-white"
                    >
                      View profile
                      <ArrowRight className="h-4 w-4" aria-hidden />
                      <span className="sr-only"> for {principal.name}</span>
                    </a>
                  </div>
                ) : null}
              </div>
            </article>
          </section>
        ) : null}

        {groups.map((group, index) => (
          <section key={group.role} aria-labelledby={`team-role-${index}`}>
            <SectionHeading
              id={`team-role-${index}`}
              eyebrow="Team"
              title={group.role}
              description={`${group.members.length} ${group.members.length === 1 ? 'member' : 'members'}`}
            />
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {group.members.map((member) => (
                <TeamCard key={member.id} member={member} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
