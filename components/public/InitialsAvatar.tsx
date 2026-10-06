import { cn } from '@/lib/utils';
import { initialsOf } from './Monogram';

/** Member avatar with graceful initials fallback when no photo is supplied. */
export default function InitialsAvatar({
  name,
  image,
  className,
}: {
  name: string;
  image?: string;
  className?: string;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name}
        className={cn('h-14 w-14 rounded-full object-cover', className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        'grid h-14 w-14 shrink-0 place-items-center rounded-full bg-navy-50 font-display text-base font-semibold text-navy-700 ring-1 ring-navy-100',
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
