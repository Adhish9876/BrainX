import { cn } from '@/lib/utils';

export default function TagList({ tags, className }: { tags: string[]; className?: string }) {
  if (!tags?.length) return null;
  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)}>
      {tags.map((tag, index) => (
        <li key={`${index}-${tag}`} className="chip max-w-full">
          {tag}
        </li>
      ))}
    </ul>
  );
}
