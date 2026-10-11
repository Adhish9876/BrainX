'use client';

import Link from 'next/link';
import TextType from '@/components/ui/TextType';

/**
 * Static hero centerpiece (logo + typed tagline) and scroll cue.
 * The text container has fixed dimensions so typing/deleting never shifts the logo.
 */
export default function HeroLogo({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center px-6">
      {/* Logo + typed quote side-by-side on desktop, stacked on mobile */}
      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-12">
        <Link
          href="/"
          aria-label="BrainX Lab home"
          className="block shrink-0 rounded-full focus-visible:outline-offset-8"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            width={560}
            height={567}
            className="h-auto w-[min(52vw,22rem)] select-none drop-shadow-[0_10px_28px_rgba(11,16,32,0.18)] lg:w-[min(36vw,22rem)]"
            draggable={false}
          />
        </Link>

        {/* Fixed-width & fixed-height slot so typing/deleting never shifts the logo */}
        <div className="flex h-[5.5rem] w-[19rem] shrink-0 items-center justify-center text-center sm:w-[22rem] lg:h-[9.5rem] lg:w-[21rem] lg:justify-start lg:text-left xl:w-[25rem]">
          <TextType
            as="p"
            text={[
              'Understanding the brain, building the interface.',
              'Decoding neural signals for human cognition.',
              'Advancing non-invasive brain–computer interfaces.',
            ]}
            typingSpeed={55}
            deletingSpeed={28}
            pauseDuration={2200}
            showCursor={true}
            cursorCharacter="|"
            cursorClassName="text-crimson-600 font-normal"
            className="font-display text-[clamp(1.5rem,2.3vw,2.6rem)] font-bold leading-[1.15] tracking-[-0.02em] text-ink [text-shadow:0_1px_14px_rgba(255,255,255,0.95),0_0_28px_rgba(255,255,255,0.9)]"
          />
        </div>
      </div>

      <a
        href="#who-we-are"
        onClick={(e) => {
          const target = document.getElementById('who-we-are');
          if (!target) return;
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        className="absolute bottom-6 left-1/2 inline-flex min-h-11 -translate-x-1/2 flex-col items-center gap-1 px-4 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-ink/80 transition-colors hover:text-ink"
      >
        Scroll
        <span aria-hidden className="h-8 w-px bg-gradient-to-b from-ink/60 to-transparent" />
      </a>
    </div>
  );
}
