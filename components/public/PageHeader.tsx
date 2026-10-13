import type { ReactNode } from 'react';

/** Editorial page header used by every top-level public page. */
export default function PageHeader({
  eyebrow,
  title,
  lead,
  className,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <header className={`border-b border-rule ${className ?? 'bg-surface'}`}>
      <div className="shell pt-5 pb-7 md:pt-6 md:pb-8">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1
          className={`${eyebrow ? 'mt-5 ' : ''}max-w-4xl font-display text-4xl leading-[1.05] tracking-tight text-ink md:text-[3.25rem]`}
        >
          {title}
        </h1>
        {lead ? (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{lead}</p>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </header>
  );
}
