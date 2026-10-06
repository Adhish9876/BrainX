import type { Metadata } from 'next';
import { Link2 } from 'lucide-react';
import InitialsAvatar from '@/components/public/InitialsAvatar';
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

export default function TeamPage() {
  const { team } = getContent();
  const principal = team.find((member) => member.role === 'Principal Investigator');
  const groups = groupTeamByRole(team.filter((member) => member.id !== principal?.id));

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title="People"
        lead="BrainX Lab brings together a principal investigator, project staff, research scholars and students working across brain–computer interfaces and affective computing."
      />

      <div className="shell space-y-16 py-14">
        {principal ? (
          <section aria-labelledby="principal-investigator">
            <SectionHeading id="principal-investigator" eyebrow="Principal Investigator" title={principal.name} />
            <div className="mt-8 grid gap-8 md:grid-cols-[auto_1fr] md:gap-10">
              <InitialsAvatar
                name={principal.name}
                image={principal.image}
                className="h-24 w-24 text-2xl"
              />
              <div>
                {principal.position ? (
                  <p className="text-sm font-medium text-navy-700">{principal.position}</p>
                ) : null}
                <p className="prose-editorial mt-4 max-w-3xl text-base">{principal.description}</p>
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <TagList tags={principal.tags} />
                  {principal.link ? (
                    <a
                      href={principal.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-arrow text-sm"
                    >
                      <Link2 className="h-4 w-4" aria-hidden />
                      Profile
                      <span className="sr-only"> for {principal.name}</span>
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
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
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {group.members.map((member) => (
                <TeamCard key={member.id} member={member} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
