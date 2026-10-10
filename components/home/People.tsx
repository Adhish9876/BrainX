import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import type { Member } from '@/lib/types';
import { groupTeamByRole } from '@/lib/content';
import ImagePlaceholder from './ImagePlaceholder';
import Reveal from './Reveal';
import SectionIntro from './SectionIntro';

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

export default function People({ team }: { team: Member[] }) {
  if (team.length === 0) return null;
  const principal = team.find((member) => member.role === 'Principal Investigator');
  const groups = groupTeamByRole(team.filter((member) => member.id !== principal?.id));

  return (
    <section id="people" aria-labelledby="people-heading" className="bg-paper py-24 md:py-32">
      <div className="shell">
        <Reveal>
          <SectionIntro index="03" label="People" id="people-heading" title="The people behind the work." />
        </Reveal>

        {principal ? (
          <div className="mt-14 grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-4">
              <ImagePlaceholder
                label="Principal investigator"
                aspect="aspect-[4/5]"
                src={principal.image || undefined}
                alt={principal.name}
              />
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-8">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-crimson-600">{principal.role}</p>
              <h3 className="mt-3 font-display text-4xl leading-tight text-ink md:text-5xl">{principal.name}</h3>
              {principal.position ? <p className="mt-2 text-muted">{principal.position}</p> : null}
              {principal.description ? (
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/85">
                  {clip(principal.description, 380)}
                </p>
              ) : null}
              {principal.tags.length > 0 ? (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {principal.tags.map((tag) => (
                    <li key={tag} className="rounded-full border border-ink/15 bg-white px-3.5 py-1.5 text-sm text-ink">
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}

              {groups.length > 0 ? (
                <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-ink/10 pt-8 sm:grid-cols-3">
                  {groups.map((group) => (
                    <div key={group.role}>
                      <dd className="font-display text-4xl leading-none text-ink">{group.members.length}</dd>
                      <dt className="mt-2 text-sm text-muted">{group.role}</dt>
                    </div>
                  ))}
                </dl>
              ) : null}
            </Reveal>
          </div>
        ) : null}

        <Reveal className="mt-14">
          <ImagePlaceholder label="Team photograph" aspect="aspect-[16/7]" tone="warm" />
        </Reveal>

        <Link
          href="/team"
          className="group mt-10 inline-flex min-h-11 items-center gap-2 text-[0.95rem] font-medium text-ink underline-offset-8 hover:underline"
        >
          Meet the full team
          <ArrowRight
            weight="bold"
            className="h-4 w-4 text-crimson-600 transition-transform group-hover:translate-x-1"
            aria-hidden
          />
        </Link>
      </div>
    </section>
  );
}
