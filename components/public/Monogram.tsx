import { cn } from '@/lib/utils';

/** Deterministic initials used when a member/logo image is unavailable. */
export function initialsOf(name: string, max = 2): string {
  return name
    .replace(/^(dr|prof|mr|ms|mrs|er)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

/**
 * Placeholder monogram for the lab. Uses the configured logo when present,
 * otherwise renders an inline navy monogram so the brand never appears broken.
 */
export function Monogram({
  logo,
  name,
  className,
  size = 44,
}: {
  logo?: string;
  name: string;
  className?: string;
  size?: number;
}) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={`${name} monogram`}
        width={size}
        height={size}
        className={cn('shrink-0 rounded-lg', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-lg bg-navy-700 font-display text-[0.95em] font-semibold text-paper',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {initialsOf(name)}
    </span>
  );
}
