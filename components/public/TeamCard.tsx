import { Link2 } from 'lucide-react';
import type { Member } from '@/lib/types';
import InitialsAvatar from './InitialsAvatar';
import TagList from './TagList';

export default function TeamCard({ member }: { member: Member }) {
  return (
    <article className="card flex h-full flex-col p-5">
      <div className="flex items-center gap-4">
        <InitialsAvatar name={member.name} image={member.image} />
        <div className="min-w-0">
          <h3 className="font-display text-lg leading-tight text-ink">{member.name}</h3>
          {member.position ? (
            <p className="mt-1 text-xs leading-snug text-muted">{member.position}</p>
          ) : null}
        </div>
      </div>

      {member.description ? (
        <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">{member.description}</p>
      ) : (
        <div className="flex-1" />
      )}

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-rule pt-4">
        <TagList tags={member.tags} />
        {member.link ? (
          <a
            href={member.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-700 transition-colors hover:text-navy-900"
          >
            <Link2 className="h-3.5 w-3.5" aria-hidden />
            Profile
            <span className="sr-only"> for {member.name}</span>
          </a>
        ) : null}
      </div>
    </article>
  );
}
