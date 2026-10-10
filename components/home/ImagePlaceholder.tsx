import { Image as ImageIcon } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/utils';

/**
 * Clearly-labelled stand-in for a photograph. Replace by passing real
 * `src`/`alt` at the call site; the aspect ratio is preserved either way.
 */
export default function ImagePlaceholder({
  label,
  aspect = 'aspect-[4/3]',
  src,
  alt = '',
  tone = 'blue',
  className,
}: {
  label: string;
  aspect?: string;
  src?: string;
  alt?: string;
  tone?: 'blue' | 'warm';
  className?: string;
}) {
  if (src) {
    return (
      <div className={cn('overflow-hidden rounded-3xl bg-navy-50', aspect, className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`Placeholder: ${label}`}
      className={cn(
        'relative isolate flex items-end overflow-hidden rounded-3xl border border-ink/10',
        tone === 'blue'
          ? 'bg-[linear-gradient(145deg,#eaf1ff,#f6f3ee_65%,#fdeee9)]'
          : 'bg-[linear-gradient(145deg,#fdeee9,#f6f3ee_60%,#eaf1ff)]',
        aspect,
        className,
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 -z-10 h-full w-full opacity-60"
      >
        <g fill="none" strokeWidth="1">
          {[34, 60, 88, 118, 150, 184, 220].map((r, i) => (
            <ellipse
              key={r}
              cx={tone === 'blue' ? 140 : 270}
              cy={tone === 'blue' ? 110 : 190}
              rx={r * 1.25}
              ry={r}
              stroke={i % 2 === 0 ? '#4a7cf7' : '#cf4330'}
              strokeOpacity={0.28 - i * 0.025}
            />
          ))}
        </g>
      </svg>
      <div className="m-4 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-3.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted backdrop-blur">
        <ImageIcon weight="duotone" className="h-4 w-4 text-navy-600" aria-hidden />
        {label}
      </div>
    </div>
  );
}
