import { cn } from '@/lib/utils';

/** Mono index/label above a serif section heading. The heading is the section's h2. */
export default function SectionIntro({
  index,
  label,
  title,
  id,
  className,
}: {
  index: string;
  label: string;
  title: string;
  id: string;
  className?: string;
}) {
  return (
    <header className={cn('max-w-3xl', className)}>
      <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-muted">
        <span className="text-crimson-600">{index}</span>
        <span aria-hidden className="h-px w-8 bg-ink/20" />
        {label}
      </p>
      <h2
        id={id}
        className="mt-5 font-display text-[2.4rem] leading-[1.05] tracking-[-0.015em] text-ink sm:text-5xl lg:text-[3.5rem]"
      >
        {title}
      </h2>
    </header>
  );
}
