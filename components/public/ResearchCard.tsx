import type { Research } from '@/lib/types';
import TagList from './TagList';

export default function ResearchCard({ research, index }: { research: Research; index: number }) {
  return (
    <article className="card group flex flex-col p-6 transition-colors hover:border-navy-200">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-display text-sm font-semibold text-navy-600">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="h-px flex-1 bg-rule" />
      </div>
      <h3 className="mt-4 font-display text-xl leading-snug text-ink">{research.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{research.description}</p>
      <TagList tags={research.tags} className="mt-5" />
    </article>
  );
}
