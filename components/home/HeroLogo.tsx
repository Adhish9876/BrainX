'use client';

import Link from 'next/link';
import TextType from '@/components/ui/TextType';

/**
 * Static hero centerpiece (logo + typed tagline) and scroll cue.
 * The text container has fixed dimensions so typing/deleting never shifts the logo.
 */
export default function HeroLogo({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center px-4">
      {/* Top-center institute banner logo */}
      <div className="pointer-events-none absolute top-1.5 sm:top-2 md:top-2.5 left-1/2 -translate-x-1/2 z-20 flex w-full justify-center px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logotop.png"
          alt="Indian Institute of Information Technology, Design and Manufacturing, Kancheepuram"
          width={2048}
          height={327}
          className="h-auto w-[min(85vw,34rem)] lg:w-[min(72vw,40rem)] object-contain select-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
          draggable={false}
        />
      </div>

      {/* Logo + typed quote side-by-side on desktop, centered cleanly in the hero banner */}
      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-10 -translate-y-4 sm:-translate-y-6 md:-translate-y-8">
        <Link
          href="/"
          aria-label="BrainX Lab home"
          className="relative block shrink-0 focus-visible:outline-offset-8"
        >
          {/* Subtle luminous ambient glow behind the logo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -m-4 rounded-full bg-white/25 blur-2xl"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo_white.png"
            alt={alt}
            width={2170}
            height={725}
            className="relative h-auto w-[min(58vw,24rem)] select-none drop-shadow-[0_6px_28px_rgba(255,255,255,0.45)] drop-shadow-[0_0_16px_rgba(255,255,255,0.3)] lg:w-[min(38vw,25rem)]"
            draggable={false}
          />
        </Link>

        {/* Fixed-width & fixed-height slot so typing/deleting never shifts the logo */}
        <div className="flex h-[5.5rem] w-[19rem] shrink-0 items-center justify-center text-center sm:w-[22rem] lg:h-[9.5rem] lg:w-[22rem] lg:justify-start lg:text-left xl:w-[26rem]">
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
            cursorClassName="text-white font-normal"
            className="font-display text-[clamp(1.3rem,2.2vw,2.5rem)] font-bold leading-[1.15] tracking-[-0.02em] text-[#38bdf8] [text-shadow:0_0_20px_rgba(56,189,248,0.5),0_2px_14px_rgba(0,0,0,0.9)]"
          />
        </div>
      </div>

      {/* Bottom-center subtle scroll cue */}
      <div className="pointer-events-none absolute bottom-6 sm:bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-xs font-medium tracking-wider uppercase text-white/75 backdrop-blur-md">
        <span>Scroll to explore</span>
        <span className="inline-block animate-bounce text-sm text-[#38bdf8]">↓</span>
      </div>
    </div>
  );
}
