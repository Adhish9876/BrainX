import type { Metadata } from 'next';
import { ArrowRight, Mail } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import PeopleRow from '@/components/public/PeopleRow';
import { getContent, groupTeamByRole } from '@/lib/content';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Team',
  description: 'The people of BrainX Lab, IIITDM Kancheepuram.',
};

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function TeamPage() {
  const { team, site } = getContent();
  const principal = team.find((member) => member.role === 'Principal Investigator');
  const rawGroups = groupTeamByRole(team.filter((member) => member.id !== principal?.id));

  // Project Staff and Research Scholar are presented together as one section
  const COMBINED_ROLES = ['Project Staff', 'Research Scholar'];
  // A person listed under both roles (same name) is shown once, with their details combined
  const combinedMembers = COMBINED_ROLES.flatMap(
    (role) => rawGroups.find((group) => group.role === role)?.members ?? [],
  ).reduce<typeof team>((merged, member) => {
    const existing = merged.find((m) => m.name.trim().toLowerCase() === member.name.trim().toLowerCase());
    if (!existing) return [...merged, { ...member }];
    const join = (x: string, y: string, sep: string) =>
      [x, y].filter((v, i, arr) => v && arr.indexOf(v) === i).join(sep);
    existing.position = join(existing.position, member.position, ' · ');
    existing.tagline = join(existing.tagline ?? '', member.tagline ?? '', ' · ');
    existing.description = join(existing.description, member.description, ' ');
    existing.image = existing.image || member.image;
    existing.link = existing.link || member.link;
    return merged;
  }, []);
  const firstCombinedIndex = rawGroups.findIndex((group) => COMBINED_ROLES.includes(group.role));
  const groups = rawGroups
    .filter((group) => !COMBINED_ROLES.includes(group.role))
    .map((group) => ({ ...group }));
  if (combinedMembers.length > 0) {
    groups.splice(Math.max(0, firstCombinedIndex), 0, {
      role: 'Project Staff & Research Scholar',
      members: combinedMembers,
    });
  }

  const sections = [
    ...(principal ? [{ role: 'Principal Investigator', members: [principal] }] : []),
    ...groups,
  ];

  return (
    <div className="relative isolate bg-white">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate -mt-22 overflow-hidden pt-22 md:-mt-24 md:pt-24">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/team_bg.png"
            alt=""
            draggable={false}
            className="h-full w-full object-cover object-left"
          />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent" />
        </div>

        <div className="shell pb-12 pt-8 sm:pb-14 sm:pt-12 md:pb-16 md:pt-14">
          <Reveal>
            <h1 className="max-w-4xl font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-[#1d1d1f] sm:text-6xl lg:text-7xl">
              The people behind the brain research.
            </h1>
          </Reveal>

        </div>
      </section>

      <div className="space-y-16 pb-20 md:space-y-20">
        {sections.map((group) => {
          const id = `role-${slugify(group.role)}`;
          return (
            <section key={group.role} id={id} aria-labelledby={`${id}-title`} className="scroll-mt-28">
              <div className="shell">
                <Reveal>
                  <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-5">
                    <h2
                      id={`${id}-title`}
                      className="font-display text-3xl font-extrabold tracking-tight text-[#1d1d1f] sm:text-4xl"
                    >
                      {group.role}
                    </h2>
                    <span className="mb-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs font-bold text-slate-600">
                      {String(group.members.length).padStart(2, '0')}
                    </span>
                  </div>
                </Reveal>
              </div>

              <Reveal delay={0.08} y={20} className="mt-8">
                <PeopleRow
                  members={group.members}
                  large={group.role === 'Principal Investigator'}
                  center={group.role === 'Principal Investigator'}
                />
              </Reveal>
            </section>
          );
        })}

        {/* ── JOIN THE LAB ───────────────────────────────────────────────── */}
        {site.email ? (
          <Reveal className="shell">
            <section
              aria-labelledby="join-title"
              className="relative overflow-hidden rounded-[2rem] bg-[#0b1020] px-6 py-12 text-white sm:px-12 sm:py-16"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-sky-500/30 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-orange-400/20 blur-3xl"
              />
              <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                <div className="max-w-xl">
                  <h2
                    id="join-title"
                    className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl"
                  >
                    Interested in working with us?
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-white/75">
                    We welcome students and collaborators curious about brain–computer interfaces and
                    affective computing. Say hello.
                  </p>
                </div>
                <a
                  href={`mailto:${site.email}`}
                  className="group inline-flex shrink-0 items-center gap-2.5 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#0b1020] transition-all hover:shadow-[0_10px_30px_-8px_rgba(255,255,255,0.5)]"
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  Get in touch
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </a>
              </div>
            </section>
          </Reveal>
        ) : null}
      </div>
    </div>
  );
}
