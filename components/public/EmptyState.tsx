import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Polished empty state — shown instead of inventing content. */
export default function EmptyState({
  icon,
  title,
  message,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'card flex flex-col items-center gap-3 px-8 py-14 text-center',
        className,
      )}
    >
      {icon ? (
        <span className="grid h-11 w-11 place-items-center rounded-full border border-rule text-navy-600">
          {icon}
        </span>
      ) : null}
      <h3 className="font-display text-lg font-medium text-ink">{title}</h3>
      <p className="max-w-md text-sm leading-relaxed text-muted">{message}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
